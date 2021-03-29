import { log } from 'meteor/unchained:core-logger';
import { Users } from 'meteor/unchained:core-users';
import { getCart } from '../../api';

export default async function loginAsGuest(root, methodArguments, context) {
  log('mutation loginAsGuest');
  const loginResponse = await Users.loginWithService(
    'guest',
    methodArguments,
    context
  );
  const { id: userId, user = null } = loginResponse;
  await getCart({ userId, user, countryContext: context.countryContext });
  return loginResponse;
}
