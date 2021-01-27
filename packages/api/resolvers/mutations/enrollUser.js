import { log } from 'meteor/unchained:core-logger';
import { Users } from 'meteor/unchained:core-users';
import hashPassword from '../../hashPassword';

export default async function enrollUser(root, options, context) {
  log('mutation enrollUser', { email: options.email, userId: context.userId });
  const mappedOptions = options;
  if (!mappedOptions.password && mappedOptions.plainPassword) {
    mappedOptions.password = hashPassword(mappedOptions.plainPassword);
    delete mappedOptions.plainPassword;
  }

  return Users.createUser(mappedOptions, {
    ...context,
    isEnrollment: true,
  });
}
