import { log } from 'meteor/unchained:core-logger';
import { DeliveryProviders } from 'meteor/unchained:core-delivery';
import { DeliverProviderNotFoundError, InvalidIdError } from '../../errors';

export default function deliveryProvider(
  root,
  { deliveryProviderId },
  { userId }
) {
  log(`query deliveryProvider ${deliveryProviderId}`, { userId });

  if (!deliveryProviderId) throw new InvalidIdError({ deliveryProviderId });

  const provider = DeliveryProviders.findProvider({ deliveryProviderId });

  if (!provider) throw new DeliverProviderNotFoundError({ deliveryProviderId });

  return provider;
}
