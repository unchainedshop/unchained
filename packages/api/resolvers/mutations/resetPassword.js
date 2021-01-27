import { log } from 'meteor/unchained:core-logger';
import { accountsPassword, dbManager } from 'meteor/unchained:core-accountsjs';
import { Users } from 'meteor/unchained:core-users';
import hashPassword from '../../hashPassword';

export default async function resetPassword(
  root,
  { token, newPlainPassword, newPassword: newHashedPassword },
  context
) {
  log('mutation resetPassword');
  if (!newHashedPassword && !newPlainPassword) {
    throw new Error('Password is required');
  }
  const userWithNewPassword = await dbManager.findUserByResetPasswordToken(
    token
  );
  const newPassword = newHashedPassword || hashPassword(newPlainPassword);
  await accountsPassword.resetPassword(token, newPassword, context);
  return Users.createLoginToken(userWithNewPassword, context);
}
