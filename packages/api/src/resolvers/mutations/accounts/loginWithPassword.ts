import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api';
import {
  AuthenticationFailedError,
  AuthOperationFailedError,
  InvalidCredentialsError,
  TwoFactorCodeDidNotMatchError,
  TwoFactorCodeRequiredError,
  UserDeactivatedError,
} from '../../../errors';
import { hashPassword } from '../../../hashPassword';

export default async function loginWithPassword(
  root: Root,
  params: {
    username?: string;
    email?: string;
    plainPassword?: string;
    totpCode?: string;
  },
  context: Context,
) {
  const { modules } = context;
  const { username, email, plainPassword, totpCode } = params;

  log('mutation loginWithPassword', { username, email });

  if (!plainPassword) {
    throw new Error('Password is required');
  }

  const mappedUserLoginParams = {
    user: email ? { email } : { username },
    password: hashPassword(plainPassword),
    code: totpCode,
  };

  try {
    const result = await modules.accounts.loginWithService(
      { service: 'password', ...mappedUserLoginParams },
      context,
    );
    return result;
  } catch (e) {
    if (e.code === 'AuthenticationFailed') throw new AuthenticationFailedError({ username, email });
    else if (e.code === 'UserDeactivated') throw new UserDeactivatedError({ username, email });
    else if (e.code === 'InvalidCredentials') throw new InvalidCredentialsError({ username, email });
    else if (e?.message?.includes('2FA code required'))
      throw new TwoFactorCodeRequiredError({ username, email });
    else if (e?.message?.includes("2FA code didn't match"))
      throw new TwoFactorCodeDidNotMatchError({ submittedCode: params.totpCode, username, email });
    else throw new AuthOperationFailedError({ submittedCode: params.totpCode, username, email });
  }
}
