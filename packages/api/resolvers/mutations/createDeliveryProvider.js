import { log } from 'unchained-logger';
import { DeliveryProviders } from 'meteor/unchained:core-delivery';
import { ProviderConfigurationInvalid } from '../../errors';

export default (root, { deliveryProvider }, { userId }) => {
  log('mutation createDeliveryProvider', { userId });
  const provider = DeliveryProviders.createProvider({
    ...deliveryProvider,
    authorId: userId,
  });
  if (!provider) throw new ProviderConfigurationInvalid(deliveryProvider);
  return provider;
};
