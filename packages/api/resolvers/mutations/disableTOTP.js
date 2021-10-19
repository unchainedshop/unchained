import { log } from 'meteor/unchained:core-logger';
import { Users } from 'meteor/unchained:core-users';

export default async function disableTOTP(root, { code }, { userId }) {
  log('mutation disableTOTP', { userId });

  return Users.disableTOTP(userId, code);
}
