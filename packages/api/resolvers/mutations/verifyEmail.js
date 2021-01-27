import { log } from 'meteor/unchained:core-logger';
import {
  accountsServer,
  accountsPassword,
  dbManager,
} from 'meteor/unchained:core-accountsjs';

export default async function verifyEmail(root, { token }, context) {
  log('mutation verifyEmail');
  const verifiedUser = await dbManager.findUserByEmailVerificationToken(token);
  await accountsPassword.verifyEmail(token);
  await accountsPassword.server
    .getHooks()
    .emit('VerifyEmailSuccess', verifiedUser);

  const {
    user: tokenUser,
    token: loginToken,
  } = await accountsServer.loginWithUser(verifiedUser, context);
  return {
    id: tokenUser._id,
    token: loginToken.token,
    tokenExpires: loginToken.when,
  };
}
