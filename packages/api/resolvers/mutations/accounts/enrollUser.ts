import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';
import hashPassword from '../../../hashPassword';
import { UserData } from '@unchainedshop/types/accounts';

export default async function enrollUser(
  root: Root,
  params: UserData,
  context: Context
) {
  const { modules, userId } = context

  log('mutation enrollUser', { email: params.email, userId });

  const mappedUserData = params;
  mappedUserData.initialPassword = true;
  if (!mappedUserData.password && mappedUserData.plainPassword) {
    mappedUserData.password = hashPassword(mappedUserData.plainPassword);
  }
  delete mappedUserData.plainPassword;

  // Skip Messaging when password is set so we
  // don't send a verification e-mail after enrollment
  const user = await modules.accounts.createUser(mappedUserData, context, {
    skipMessaging: !!mappedUserData.password,
  });

  return user;
}
