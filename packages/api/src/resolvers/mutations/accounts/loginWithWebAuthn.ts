import { log } from '@unchainedshop/logger';
import { Context } from '../../../context.js';
import { UserNotFoundError, WebAuthnDisabledError } from '../../../errors.js';

export default async function loginWithWebAuthn(
  root: never,
  params: {
    webAuthnPublicKeyCredentials?: any;
  },
  context: Context,
) {
  log('mutation loginWithWebAuthn');

  const username =
    Buffer.from(params.webAuthnPublicKeyCredentials?.response?.userHandle, 'base64').toString() || '';

  let user = await context.modules.users.findUserByUsername(username);
  if (!user) throw new UserNotFoundError({ username });

  const verification = await context.modules.users.webAuthn.verifyCredentialRequest(
    user.services?.webAuthn,
    user.username,
    params.webAuthnPublicKeyCredentials,
  );

  if (!verification) throw new WebAuthnDisabledError();

  user = await context.modules.users.updateHeartbeat(user._id, {
    remoteAddress: context.remoteAddress,
    remotePort: context.remotePort,
    userAgent: context.getHeader('user-agent'),
    locale: context.locale?.baseName,
    countryCode: context.countryCode,
  });

  if (context.userId) {
    await context.services.users.migrateUserData(context.userId, user._id);
  }

  await context.services.orders.nextUserCart({ user, countryCode: context.countryCode });

  return context.login(user);
}
