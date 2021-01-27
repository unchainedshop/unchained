import { log } from 'meteor/unchained:core-logger';
import {
  accountsPassword,
  dbManager,
  accountsServer,
} from 'meteor/unchained:core-accountsjs';
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
  const userWithNewPassword = await dbManager.findUserByEmailVerificationToken(
    token
  );
  const newPassword = newHashedPassword || hashPassword(newPlainPassword);
  await accountsPassword.resetPassword(token, newPassword, context);

  const {
    user: tokenUser,
    token: loginToken,
  } = await accountsServer.loginWithUser(userWithNewPassword, context);
  return {
    id: tokenUser._id,
    token: loginToken.token,
    tokenExpires: loginToken.when,
  };
}
