import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api';
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

  return modules.accounts.loginWithService({ service: 'password', ...mappedUserLoginParams }, context);
}
