import { log } from 'meteor/unchained:core-logger';
import { Users } from 'meteor/unchained:core-users';

export default async function authenticateWithTOTP(
  root,
  { code },
  { userId, user }
) {
  log('mutation authenticateWithTOTP', { userId, code });

  return Users.authenticateWithTOTP(user, code);
}
