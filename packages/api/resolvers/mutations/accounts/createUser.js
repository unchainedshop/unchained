import { Meteor } from 'meteor/meteor';
import callMethod from '../../../callMethod';
import hashPassword from '../../../hashPassword';
import { accountsPassword } from '../../../api';

export default async function createUser(root, options, context) {
  Meteor._nodeCodeMustBeInFiber(); // eslint-disable-line
  if (!options.password && !options.plainPassword) {
    throw new Error('Password is required');
  }
  const mappedOptions = options;
  if (!mappedOptions.password) {
    mappedOptions.password = hashPassword(mappedOptions.plainPassword);
    delete mappedOptions.plainPassword;
  }
  await accountsPassword.createUser(mappedOptions);
}
