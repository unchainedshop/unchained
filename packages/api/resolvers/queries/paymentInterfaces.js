import { log } from 'meteor/unchained:core-logger';
import { PaymentDirector } from 'meteor/unchained:core-payment';

export default function paymentInterfaces(root, { type }, { userId }) {
  log(`query paymentInterfaces ${type}`, { userId });

  return PaymentDirector.filteredAdapters((Interface) =>
    Interface.typeSupported(type)
  ).map((Interface) => ({
    _id: Interface.key,
    label: Interface.label,
    version: Interface.version,
  }));
}
