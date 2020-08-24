import { log } from 'meteor/unchained:core-logger';
import { DeliveryDirector } from 'meteor/unchained:core-delivery';

export default function deliveryInterfaces(root, { type }, { userId }) {
  log(`query deliveryInterfaces ${type}`, { userId });
  return DeliveryDirector.filteredAdapters((Interface) =>
    Interface.typeSupported(type),
  ).map((Interface) => ({
    _id: Interface.key,
    label: Interface.label,
    version: Interface.version,
  }));
}
