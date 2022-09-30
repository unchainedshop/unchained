import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api';

export default async function loginWithWebAuthn(
  root: Root,
  params: {
    webAuthnPublicKeyCredentials?: any;
  },
  context: Context,
) {
  const { modules } = context;

  log('mutation loginWithWebAuthn');

  return modules.accounts.loginWithService({ service: 'webAuthn', ...params }, context);
}
