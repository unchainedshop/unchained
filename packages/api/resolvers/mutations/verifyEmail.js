import { log } from 'meteor/unchained:core-logger';
import {
  accountsServer,
  accountsPassword,
  dbManager,
} from 'meteor/unchained:core-accountsjs';
import { Users } from 'meteor/unchained:core-users';

export default async function verifyEmail(root, { token }, context) {
  log('mutation verifyEmail');
  const verifiedUser = await dbManager.findUserByEmailVerificationToken(token);
  await accountsPassword.verifyEmail(token);
  await accountsServer.getHooks().emit('VerifyEmailSuccess', verifiedUser);
  return Users.createLoginToken(verifiedUser, context);
}
