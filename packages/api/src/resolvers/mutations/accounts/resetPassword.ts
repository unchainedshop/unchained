import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api.js';
import { InvalidResetTokenError } from '../../../errors.js';

export default async function resetPassword(
  root: Root,
  params: { newPassword?: string; token: string },
  context: Context,
) {
  const { modules, userId } = context;

  log('mutation resetPassword', { userId });

  if (!params.newPassword) {
    throw new Error('Password is required');
  }
  let user = await modules.users.findUserByResetToken(params.token);

  if (!user) throw new InvalidResetTokenError({});
  await modules.users.setPassword(user._id, params.newPassword);

  user = await context.modules.users.updateHeartbeat(user._id, {
    remoteAddress: context.remoteAddress,
    remotePort: context.remotePort,
    userAgent: context.userAgent,
    locale: context.localeContext.normalized,
    countryCode: context.countryContext,
  });

  return context.login(user);
}
