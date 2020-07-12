import { log } from 'meteor/unchained:core-logger';
import { WarehousingProviders } from 'meteor/unchained:core-warehousing';

export default (root, { warehousingProviderId }, { userId }) => {
  log(`mutation removeWarehousingProvider ${warehousingProviderId}`, {
    userId,
  });
  if (!warehousingProviderId)
    throw new Error('Invalid warehousing provider ID provided');
  return WarehousingProviders.removeProvider({
    _id: warehousingProviderId,
  });
};
