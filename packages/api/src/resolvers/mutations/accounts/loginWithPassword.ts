import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api.js';
import {
  AuthenticationFailedError,
  AuthOperationFailedError,
  InvalidCredentialsError,
  UserDeactivatedError,
} from '../../../errors.js';
import { hashPassword } from '../../../hashPassword.js';

export default async function loginWithPassword(
  root: Root,
  params: {
    username?: string;
    email?: string;
    plainPassword?: string;
  },
  context: Context,
) {
  const { modules } = context;
  const { username, email, plainPassword } = params;

  log('mutation loginWithPassword', { username, email });

  if (!plainPassword) {
    throw new Error('Password is required');
  }

  const mappedUserLoginParams = {
    user: email ? { email } : { username },
    password: hashPassword(plainPassword),
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
    else throw new AuthOperationFailedError({ username, email });
  }
}
