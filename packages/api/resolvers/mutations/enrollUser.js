import { log } from 'meteor/unchained:core-logger';
import { Users } from 'meteor/unchained:core-users';
import hashPassword from '../../hashPassword';

export default function enrollUser(root, options, { userId }) {
  log('mutation enrollUser', { email: options.email, userId });
  const mappedOptions = options;
  if (!mappedOptions.password && mappedOptions.plainPassword) {
    mappedOptions.password = hashPassword(mappedOptions.plainPassword);
    delete mappedOptions.plainPassword;
  }
  return Users.enrollUser(mappedOptions);
}
