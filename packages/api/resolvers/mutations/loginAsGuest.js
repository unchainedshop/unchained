import { log } from 'meteor/unchained:core-logger';
import { Users } from 'meteor/unchained:core-users';

export default async function loginAsGuest(root, methodArguments, context) {
  log('mutation loginAsGuest');
  const loginResponse = await Users.loginWithService(
    'guest',
    methodArguments,
    context
  );

  return loginResponse;
}
