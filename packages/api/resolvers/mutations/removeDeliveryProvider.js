import { log } from 'meteor/unchained:core-logger';
import { DeliveryProviders } from 'meteor/unchained:core-delivery';
import { DeliverProviderNotFoundError } from '../../errors';

export default (root, { deliveryProviderId }, { userId }) => {
  log(`mutation removeDeliveryProvider ${deliveryProviderId}`, { userId });
  if (!deliveryProviderId)
    throw new Error('Invalid delivery provider ID provided');
  const provider = DeliveryProviders.findOne({ _id: deliveryProviderId });
  if (!provider) throw new DeliverProviderNotFoundError({ deliveryProviderId });
  return DeliveryProviders.removeProvider({
    _id: deliveryProviderId,
  });
};
