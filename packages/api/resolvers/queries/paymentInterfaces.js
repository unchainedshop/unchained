import { log } from 'meteor/unchained:logger';
import { PaymentProviders } from 'meteor/unchained:core-payment';

export default function paymentInterfaces(root, { type }, { userId }) {
  log(`query paymentInterfaces ${type}`, { userId });
  return PaymentProviders.findInterfaces({ type });
}
