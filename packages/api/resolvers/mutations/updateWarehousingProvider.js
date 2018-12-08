import { log } from 'meteor/unchained:core-logger';
import { WarehousingProviders } from 'meteor/unchained:core-warehousing';

export default (root, { warehousingProvider, warehousingProviderId }, { userId }) => {
  log(`mutation updateWarehousingProvider ${warehousingProviderId}`, { userId });
  const provider = WarehousingProviders.updateProvider({
    warehousingProviderId,
    ...warehousingProvider,
  });
  return provider;
};
