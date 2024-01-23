import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api.js';

export default async function loginWithWebAuthn(
  root: Root,
  params: {
    webAuthnPublicKeyCredentials?: any;
  },
  context: Context,
) {
  log('mutation loginWithWebAuthn');

  const username =
    Buffer.from(params.webAuthnPublicKeyCredentials?.response?.userHandle, 'base64').toString() || '';

  let user = await context.modules.users.findUserByUsername(username);
  if (!user) throw new Error('User not found');

  await context.modules.users.webAuthn.verifyCredentialRequest(
    user.services?.webAuthn,
    user.username,
    params.webAuthnPublicKeyCredentials,
  );

  user = await context.modules.users.updateHeartbeat(user._id, {
    remoteAddress: context.remoteAddress,
    remotePort: context.remotePort,
    userAgent: context.userAgent,
    locale: context.localeContext.normalized,
    countryCode: context.countryContext,
  });

  return context.login(user);
}
