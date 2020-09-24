import { log } from 'meteor/unchained:core-logger';
import { accountsServer } from 'meteor/unchained:core-accountsjs';

export default async function loginAsGuest(root, methodArguments, context) {
  log('mutation loginAsGuest');
  const {
    user: { userId },
    token,
  } = await accountsServer.loginWithService('guest', methodArguments, context);

  return {
    id: userId,
    token: token.token,
    tokenExpires: token.when,
  };
}
