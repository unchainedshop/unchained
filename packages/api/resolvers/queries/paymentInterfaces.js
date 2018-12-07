import { log } from 'meteor/unchained:core-logger';
import { PaymentDirector } from 'meteor/unchained:core-payment';

export default function (root, { type }, { userId }) {
  log(`query payment-interfaces ${type}`, { userId });
  return PaymentDirector
    .filteredAdapters(Interface => Interface.typeSupported(type))
    .map(Interface => ({
      _id: Interface.key,
      label: Interface.label,
      version: Interface.version,
    }));
}
