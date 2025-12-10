import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';
import { UserNotFoundError } from '../../../errors.ts';

export default async function stopImpersonation(root: never, _, context: Context) {
  const { userId, modules, impersonatorId } = context;

  log(`mutation stopImpersonation for ${userId}`);

  if (!impersonatorId) return null;

  const impersonator = await modules.users.findUserById(impersonatorId);

  if (!impersonator) throw new UserNotFoundError({ userId: impersonatorId });

  await context.logout();

  await context.services.orders.nextUserCart({
    user: impersonator,
    countryCode: context.countryCode,
  });

  return context.login(impersonator);
}
