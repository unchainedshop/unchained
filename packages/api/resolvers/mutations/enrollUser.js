import { log } from 'meteor/unchained:core-logger';
import { Users } from 'meteor/unchained:core-users';

export default function (root, {
  email, password, profile,
}, { userId }) {
  log(`mutation enrollUser ${email}`, { userId });
  return Users.enrollUser({
    password,
    email,
    ...profile,
  });
}
