import { log } from 'meteor/unchained:core-logger';
import { Users } from 'meteor/unchained:core-users';
import hashPassword from '../../hashPassword';
import getCart from '../../getCart';

export default async function createUser(root, options, context) {
  log('mutation createUser', { email: options.email });
  if (!options.password && !options.plainPassword) {
    throw new Error('Password is required');
  }
  const mappedOptions = options;
  if (!mappedOptions.password) {
    mappedOptions.password = hashPassword(mappedOptions.plainPassword);
    delete mappedOptions.plainPassword;
  }

  const user = await Users.createUser(mappedOptions, context);
  await getCart({
    user,
    countryContext: context.countryContext,
  });

  return Users.createLoginToken(user, context);
}
