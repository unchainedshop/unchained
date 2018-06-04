import { Meteor } from 'meteor/meteor';
import callMethod from '../../../callMethod';
import hashPassword from './hashPassword';
import getUserLoginMethod from './oauth/getUserLoginMethod';

export default async function (root, {
  username, email, password: hashedPassword, plainPassword,
}, context) {
  if (!hashedPassword && !plainPassword) {
    throw new Error('Password is required');
  }
  const password = hashedPassword || hashPassword(plainPassword);
  const user = email ? { email } : { username };

  const methodArguments = {
    user,
    password,
  };
  try {
    return callMethod(context, 'login', methodArguments);
  } catch (error) {
    if (error.reason === 'User has no password set') {
      const method = getUserLoginMethod(email || username);
      if (method === 'no-password') {
        throw new Meteor.Error('no-password', 'User has no password set, go to forgot password');
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
