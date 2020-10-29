import { log } from 'meteor/unchained:core-logger';
import {
  accountsServer,
  accountsPassword,
  dbManager,
} from 'meteor/unchained:core-accountsjs';

export default async function verifyEmail(root, { token }) {
  log('mutation verifyEmail');
  const user = await dbManager.findUserByEmailVerificationToken(token);
  await accountsPassword.verifyEmail(token);
  const {
    user: { services, roles, ...userData },
    token: loginToken,
  } = await accountsServer.loginWithUser(user);
  return {
    id: userData._id,
    token: loginToken.token,
    tokenExpires: loginToken.when,
  };
}
