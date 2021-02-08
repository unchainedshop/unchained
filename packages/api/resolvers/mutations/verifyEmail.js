import { log } from 'meteor/unchained:core-logger';
import {
  accountsServer,
  accountsPassword,
  dbManager,
} from 'meteor/unchained:core-accountsjs';
import { Users } from 'meteor/unchained:core-users';

export default async function verifyEmail(root, { token }, context) {
  log('mutation verifyEmail');
  const unverifiedUser = await dbManager.findUserByEmailVerificationToken(
    token
  );
  await accountsPassword.verifyEmail(token);
  const verifiedUser = Users.findUser({ userId: unverifiedUser._id });
  await accountsServer.getHooks().emit('VerifyEmailSuccess', verifiedUser);
  return Users.createLoginToken(unverifiedUser, context);
}
