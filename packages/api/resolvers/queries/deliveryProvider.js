import { log } from 'meteor/unchained:core-logger';
import { DeliveryProviders } from 'meteor/unchained:core-delivery';
import { DeliverProviderNotFoundError, InvalidIdError } from '../../errors';

export default function (root, { deliveryProviderId }, { userId }) {
  log(`query delivery-provider ${deliveryProviderId}`, { userId });

  if (!deliveryProviderId) throw new InvalidIdError({ deliveryProviderId });

  const provider = DeliveryProviders.findProviderById(deliveryProviderId);

  if (!provider) throw new DeliverProviderNotFoundError({ deliveryProviderId });

  return provider;
}
