import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api';
import {
  InvalidCredentialsError,
  TwoFactorCodeDidNotMatchError,
  TwoFactorCodeRequiredError,
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
    if (e.code === 'InvalidCredentials') throw new InvalidCredentialsError({});
    else if (e?.message?.includes('2FA code required')) throw new TwoFactorCodeRequiredError({});
    else if (e?.message?.includes("2FA code didn't match"))
      throw new TwoFactorCodeDidNotMatchError({ submittedCode: params.totpCode });
    else throw e;
  }
}
