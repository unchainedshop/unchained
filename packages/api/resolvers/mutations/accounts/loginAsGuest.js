import { log } from 'meteor/unchained:core-logger';
import callMethod from '../../../callMethod';

export default function loginAsGuest(root, methodArguments, context) {
  log('mutation loginAsGuest');
  return callMethod(context, 'login', {
    ...methodArguments,
    createGuest: true,
  });
}
