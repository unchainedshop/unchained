import { log } from 'meteor/unchained:core-logger';
import { WarehousingProviders } from 'meteor/unchained:core-warehousing';

export default function(root, { type }, { userId }) {
  log(`query warehousing-providers ${type}`, { userId });
  return WarehousingProviders.findProviders({ type });
}
