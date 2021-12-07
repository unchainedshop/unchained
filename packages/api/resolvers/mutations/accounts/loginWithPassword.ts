import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';
import hashPassword from '../../../hashPassword';

export default async function loginWithPassword(
  root: Root,
  params: {
    username?: string;
    email?: string;
    password?: string;
    plainPassword?: string;
    totpCode?: string;
  },
  context: Context
) {
  const { modules } = context;
  const {
    username,
    email,
    password: hashedPassword,
    plainPassword,
    totpCode,
  } = params;

  log('mutation loginWithPassword', { username, email });

  if (!hashedPassword && !plainPassword) {
    throw new Error('Password is required');
  }

  const mappedUserLoginParams = {
    user: email ? { email } : { username },
    password: hashedPassword || hashPassword(plainPassword),
    code: totpCode,
  };

  return await modules.accounts.loginWithService(
    { service: 'password', ...mappedUserLoginParams },
    context
  );
}
