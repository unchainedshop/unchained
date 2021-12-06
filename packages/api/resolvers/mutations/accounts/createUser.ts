import { log } from 'meteor/unchained:logger';
import hashPassword from '../../../hashPassword';
import { Context, Root } from '@unchainedshop/types/api';
import { UserNotFoundError } from '../../../errors';
import { UserProfile } from '@unchainedshop/types/user';

export default async function removeEmail(
  root: Root,
  params: {
    email?: string;
    password: string;
    plainPassword?: string;
    profile?: UserProfile;
    username?: string;
  },
  context: Context
) {
  const { modules, userId } = context

  log('mutation createUser', { email: params.email, userId });

  if (!params.password && !params.plainPassword) {
    throw new Error('Password is required');
  }

  const mappedUser = params;
  if (!mappedUser.password) {
    mappedUser.password = hashPassword(mappedUser.plainPassword);
    delete mappedUser.plainPassword;
  }

  const newUserId = await modules.accounts.createUser(mappedUser, context, {});
  await modules.users.findUser({ userId: newUserId })

  return await modules.accounts.createLogintoken(newUserId, context);
}
