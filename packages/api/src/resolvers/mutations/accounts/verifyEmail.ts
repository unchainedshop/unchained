import { log } from '@unchainedshop/logger';
import { InvalidEmailVerificationTokenError } from '../../../errors.js';
import { Context } from '../../../context.js';

export default async function verifyEmail(root: never, { token }: { token: any }, context: Context) {
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
    locale: context.localeContext.baseName,
    countryCode: context.countryContext,
  });

  return context.login(user);
}
