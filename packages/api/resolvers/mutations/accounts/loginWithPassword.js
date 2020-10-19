import { log } from 'meteor/unchained:core-logger';
import { accountsServer } from 'meteor/unchained:core-accountsjs';
import hashPassword from '../../../hashPassword';
import { filterContext, evaluateContext } from '../../../callMethod';

export default async function loginWithPassword(
  root,
  { username, email, password: hashedPassword, plainPassword },
  context
) {
  log('mutation loginWithPassword', { username, email });
  if (!hashedPassword && !plainPassword) {
    throw new Error('Password is required');
  }

  const password = hashedPassword || hashPassword(plainPassword);
  const userQuery = email ? { email } : { username };

  const { user, token } = await accountsServer.loginWithService(
    'password',
    {
      user: userQuery,
      password,
    },
    evaluateContext(filterContext(context))
  );

  return {
    id: user._id,
    token: token.token,
    tokenExpires: token.when,
    type: 'password',
  };
}
