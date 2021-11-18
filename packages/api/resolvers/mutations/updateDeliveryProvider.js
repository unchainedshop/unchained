import { log } from 'unchained-logger';
import { DeliveryProviders } from 'meteor/unchained:core-delivery';
import { DeliverProviderNotFoundError, InvalidIdError } from '../../errors';

export default function updateDeliveryProvider(
  root,
  { deliveryProvider, deliveryProviderId },
  { userId }
) {
  log(`mutation updateDeliveryProvider ${deliveryProviderId}`, { userId });
  if (!deliveryProviderId) throw new InvalidIdError({ deliveryProviderId });
  if (!DeliveryProviders.providerExists({ deliveryProviderId }))
    throw new DeliverProviderNotFoundError({ deliveryProviderId });
  return DeliveryProviders.updateProvider({
    _id: deliveryProviderId,
    ...deliveryProvider,
  });
}
