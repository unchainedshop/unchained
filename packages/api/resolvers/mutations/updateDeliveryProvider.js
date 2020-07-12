import { log } from 'meteor/unchained:core-logger';
import { DeliveryProviders } from 'meteor/unchained:core-delivery';
import { DeliverProviderNotFoundError } from '../../errors';

export default function (
  root,
  { deliveryProvider, deliveryProviderId },
  { userId },
) {
  log(`mutation updateDeliveryProvider ${deliveryProviderId}`, { userId });
  if (!deliveryProviderId)
    throw new Error('Invalid delivery provider ID provided');
  const provider = DeliveryProviders.findOne({
    _id: deliveryProviderId,
    deleted: null,
  });
  if (!provider) throw new DeliverProviderNotFoundError({ deliveryProviderId });
  return DeliveryProviders.updateProvider({
    _id: deliveryProviderId,
    ...deliveryProvider,
  });
}
