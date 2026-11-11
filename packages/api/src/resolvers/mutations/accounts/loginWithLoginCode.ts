import { log } from '@unchainedshop/logger';
import { userSettings } from '@unchainedshop/core-users';
import { InvalidCredentialsError } from '../../../errors.ts';
import type { Context } from '../../../context.ts';

export default async function loginWithLoginCode(
  root: never,
  credentials: { email?: string; code?: string; token?: string },
  context: Context,
) {
  log('mutation loginWithLoginCode', { userId: context.userId });

  const user = await context.services.users.loginWithLoginCode(credentials, {
    userIdBeforeLogin: context.userId,
    countryCode: context.countryCode,
    lastLogin: {
      remoteAddress: context.remoteAddress,
      remotePort: context.remotePort,
      userAgent: context.getHeader('user-agent'),
      locale: context.locale?.baseName,
      countryCode: context.countryCode,
    },
  });
  if (!user) throw new InvalidCredentialsError({ email: credentials.email });

  return context.login(user, { expiresIn: userSettings.loginCode.sessionExpiresInSeconds });
}
