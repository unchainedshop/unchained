import { log } from 'meteor/unchained:core-logger';
import { WarehousingProviders } from 'meteor/unchained:core-warehousing';

export default (root, { warehousingProvider }, { userId }) => {
  log('mutation createWarehousingProvider', { userId });
  const provider = WarehousingProviders.createProvider({
    ...warehousingProvider,
  });
  return provider;
};
