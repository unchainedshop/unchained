import { log } from 'meteor/unchained:core-logger';
import { WarehousingDirector } from 'meteor/unchained:core-warehousing';

export default function (root, { type }, { userId }) {
  log(`query warehousing-interfaces ${type}`, { userId });
  return WarehousingDirector.filteredAdapters((Interface) =>
    Interface.typeSupported(type),
  ).map((Interface) => ({
    _id: Interface.key,
    label: Interface.label,
    version: Interface.version,
  }));
}
