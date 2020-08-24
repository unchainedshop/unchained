import { log } from 'meteor/unchained:core-logger';
import { WarehousingProviders } from 'meteor/unchained:core-warehousing';

export default function warehousingProviders(root, { type }, { userId }) {
  log(`query warehousingProviders ${type}`, { userId });

  return WarehousingProviders.findProviders({ type });
}
