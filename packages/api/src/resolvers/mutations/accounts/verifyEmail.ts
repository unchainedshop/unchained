import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api.js';
import { InvalidEmailVerificationTokenError } from '../../../errors.js';

export default async function verifyEmail(root: Root, { token }: { token: any }, context: Context) {
  const { modules, userId } = context;

  log(`mutation verifyEmail ${userId}`, { userId });

  const unverifiedToken = await modules.users.findUnverifiedEmailToken(token);

  if (!unverifiedToken) {
    throw new InvalidEmailVerificationTokenError({ token });
  }

  await modules.users.verifyEmail(unverifiedToken.userId, unverifiedToken.address);

  const user = await context.modules.users.updateHeartbeat(unverifiedToken.userId, {
    remoteAddress: context.remoteAddress,
    remotePort: context.remotePort,
    userAgent: context.userAgent,
    locale: context.localeContext.normalized,
    countryCode: context.countryContext,
  });

  return context.login(user);
}
