import { log } from 'meteor/unchained:core-logger';
import { DeliveryProviders } from 'meteor/unchained:core-delivery';
import { DeliverProviderNotFoundError, InvalidIdError } from '../../errors';

export default (root, { deliveryProviderId }, { userId }) => {
  log(`mutation removeDeliveryProvider ${deliveryProviderId}`, { userId });
  if (!deliveryProviderId) throw new InvalidIdError({ deliveryProviderId });
  const provider = DeliveryProviders.findOne({ _id: deliveryProviderId });
  if (!provider) throw new DeliverProviderNotFoundError({ deliveryProviderId });
  return DeliveryProviders.removeProvider({
    _id: deliveryProviderId,
  });
};
