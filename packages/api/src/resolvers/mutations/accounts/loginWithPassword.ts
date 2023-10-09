import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api.js';
import {
  AuthenticationFailedError,
  AuthOperationFailedError,
  InvalidCredentialsError,
  UserDeactivatedError,
} from '../../../errors.js';

export default async function loginWithPassword(
  root: Root,
  params: {
    username?: string;
    email?: string;
    password?: string;
  },
  context: Context,
) {
  const { modules } = context;
  const { username, email, password } = params;

  log('mutation loginWithPassword', { username, email });

  if (!password) {
    throw new Error('Password is required');
  }

  const mappedUserLoginParams = {
    user: email ? { email } : { username },
    password,
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
