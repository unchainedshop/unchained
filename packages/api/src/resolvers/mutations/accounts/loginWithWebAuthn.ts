import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api';
import {
  AuthenticationFailedError,
  AuthOperationFailedError,
  UserDeactivatedError,
} from '../../../errors';

export default async function loginWithWebAuthn(
  root: Root,
  params: {
    webAuthnPublicKeyCredentials?: any;
  },
  context: Context,
) {
  const { modules } = context;

  log('mutation loginWithWebAuthn');
  try {
    const result = await modules.accounts.loginWithService({ service: 'webAuthn', ...params }, context);
    return result;
  } catch (e) {
    if (e.code === 'AuthenticationFailed') throw new AuthenticationFailedError({});
    else if (e.code === 'UserDeactivated') throw new UserDeactivatedError({});
    else throw new AuthOperationFailedError({});
  }
}
