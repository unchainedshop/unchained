import { log } from 'meteor/unchained:core-logger';
import { WarehousingProviders } from 'meteor/unchained:core-warehousing';

export default (root, { warehousingProviderId }, { userId }) => {
  log(`mutation removeWarehousingProvider ${warehousingProviderId}`, { userId });
  const provider = WarehousingProviders.removeProvider({ _id: warehousingProviderId });
  return provider;
};
