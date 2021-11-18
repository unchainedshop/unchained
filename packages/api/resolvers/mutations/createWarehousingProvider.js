import { log } from 'unchained-logger';
import { WarehousingProviders } from 'meteor/unchained:core-warehousing';
import { ProviderConfigurationInvalid } from '../../errors';

export default (root, { warehousingProvider }, { userId }) => {
  log('mutation createWarehousingProvider', { userId });
  const provider = WarehousingProviders.createProvider({
    ...warehousingProvider,
    authorId: userId,
  });
  if (!provider) throw new ProviderConfigurationInvalid(warehousingProvider);
  return provider;
};
