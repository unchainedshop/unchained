import { Meteor } from 'meteor/meteor';
import { accountsServer } from 'meteor/unchained:core-accountsjs';
import hashPassword from '../../../hashPassword';
import getUserLoginMethod from './getUserLoginMethod';
import { filterContext, evaluateContext } from '../../../callMethod';

export default async function loginWithPassword(
  root,
  { username, email, password: hashedPassword, plainPassword },
  context,
) {
  if (!hashedPassword && !plainPassword) {
    throw new Error('Password is required');
  }

  const password = hashedPassword || hashPassword(plainPassword);
  const userQuery = email ? { email } : { username };

  try {
    const { user, token } = await accountsServer.loginWithService(
      'password',
      {
        user: userQuery,
        password,
      },
      evaluateContext(filterContext(context)),
    );

    return {
      id: user._id,
      token: token.token,
      tokenExpires: token.when,
      type: 'password',
    };
  } catch (error) {
    if (error.reason === 'User has no password set') {
      const method = getUserLoginMethod(email || username);
      if (method === 'no-password') {
        throw new Meteor.Error(
          'no-password',
          'User has no password set, go to forgot password',
        );
      } else if (method) {
        throw new Error(`User is registered with ${method}.`);
      } else {
        throw new Error('User has no login methods');
      }
    } else {
      throw error;
    }
  }
}
