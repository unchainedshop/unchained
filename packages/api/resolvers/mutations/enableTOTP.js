import { log } from 'meteor/unchained:core-logger';
import { Users } from 'meteor/unchained:core-users';

export default async function enableTOTP(root, { code, secret }, { userId }) {
  log('mutation enableTOTP', { userId, code });

  return Users.enableTOTP(userId, secret, code);
}
