import { log } from 'meteor/unchained:core-logger';
import {
  accountsPassword,
  accountsServer,
} from 'meteor/unchained:core-accountsjs';
import hashPassword from '../../../hashPassword';

export default async function createUser(root, options) {
  log('mutation createUser', { email: options.email });
  if (!options.password && !options.plainPassword) {
    throw new Error('Password is required');
  }
  const mappedOptions = options;
  if (!mappedOptions.password) {
    mappedOptions.password = hashPassword(mappedOptions.plainPassword);
    delete mappedOptions.plainPassword;
  }
  const userId = await accountsPassword.createUser(mappedOptions);
  const createdUser = await accountsServer.findUserById(userId);

  const {
    user: { services, roles, ...userData },
    token: loginToken,
  } = await accountsServer.loginWithUser(createdUser);
  return {
    id: userData._id,
    token: loginToken.token,
    tokenExpires: loginToken.when,
  };
}
