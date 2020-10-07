import { Users } from 'meteor/unchained:core-users';
import {
  accountsPassword,
  accountsServer,
} from 'meteor/unchained:core-accountsjs';
import hashPassword from '../../../hashPassword';

export default async function resetPassword(
  root,
  { token, newPlainPassword, newPassword: newHashedPassword },
  context
) {
  if (!newHashedPassword && !newPlainPassword) {
    throw new Error('Password is required');
  }
  const newPassword = newHashedPassword || hashPassword(newPlainPassword);
  const user = Users.findOne({ 'services.password.reset.token': token });
  await accountsPassword.resetPassword(token, newPassword);

  const { token: loginToken } = await accountsServer.loginWithUser(user._id);

  return {
    id: user._id,
    token: loginToken.token,
    tokenExpires: loginToken.when,
  };
}
