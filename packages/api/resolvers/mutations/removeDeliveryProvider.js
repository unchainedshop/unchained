import { log } from 'meteor/unchained:logger';
import { DeliveryProviders } from 'meteor/unchained:core-delivery';
import { DeliverProviderNotFoundError, InvalidIdError } from '../../errors';

export default (root, { deliveryProviderId }, { userId }) => {
  log(`mutation removeDeliveryProvider ${deliveryProviderId}`, { userId });
  if (!deliveryProviderId) throw new InvalidIdError({ deliveryProviderId });
  const provider = DeliveryProviders.findProvider({ deliveryProviderId });
  if (!provider) throw new DeliverProviderNotFoundError({ deliveryProviderId });
  DeliveryProviders.removeProvider({
    _id: deliveryProviderId,
  });
  return DeliveryProviders.findProvider({ deliveryProviderId });
};
