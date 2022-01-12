import { UserData } from '@unchainedshop/types/accounts';
import { Context, Root } from '@unchainedshop/types/api';
import { log } from 'meteor/unchained:logger';
import { hashPassword } from '../../../hashPassword';

export default async function createUser(
  root: Root,
  params: UserData,
  context: Context
) {
  const { modules, userId } = context;

  log('mutation createUser', { email: params.email, userId });

  if (!params.password && !params.plainPassword) {
    throw new Error('Password is required');
  }

  const mappedUser = params;
  if (!mappedUser.password) {
    mappedUser.password = hashPassword(mappedUser.plainPassword);
  }
  delete mappedUser.plainPassword;

  const newUserId = await modules.accounts.createUser(mappedUser, {});
  await modules.users.findUser({ userId: newUserId });

  return await modules.accounts.createLoginToken(newUserId, context);
}
