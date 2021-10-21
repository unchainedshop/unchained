import { log } from 'meteor/unchained:core-logger';
import { Users } from 'meteor/unchained:core-users';

export default async function buildTOTPSecret(root, _, { userId }) {
  log('mutation buildTOTPSecret', { userId });

  return Users.buildTOTPSecret();
}
