import { log } from 'meteor/unchained:core-logger';
import { WarehousingProviders } from 'meteor/unchained:core-warehousing';

export default function warehousingProvidersCount(root, { type }, { userId }) {
  log(`query warehousingProvidersCount ${type}`, { userId });
  return WarehousingProviders.count({ type });
}
