import { log } from 'meteor/unchained:logger';
import { Users } from 'meteor/unchained:core-users';
import hashPassword from '../../hashPassword';

export default async function enrollUser(root, options, context) {
  log('mutation enrollUser', { email: options.email, userId: context.userId });
  const mappedOptions = options;
  if (!mappedOptions.password && mappedOptions.plainPassword) {
    mappedOptions.password = hashPassword(mappedOptions.plainPassword);
  }
  delete mappedOptions.plainPassword;
  mappedOptions.initialPassword = true;

  // Skip Messaging when password is set so we
  // don't send a verification e-mail after enrollment
  const user = await Users.createUser(mappedOptions, context, {
    skipMessaging: !!mappedOptions.password,
  });

  return user;
}
