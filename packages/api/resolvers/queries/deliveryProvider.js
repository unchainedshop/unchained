import { log } from 'meteor/unchained:logger';
import { DeliveryProviders } from 'meteor/unchained:core-delivery';
import { InvalidIdError } from '../../errors';

export default function deliveryProvider(
  root,
  { deliveryProviderId },
  { userId }
) {
  log(`query deliveryProvider ${deliveryProviderId}`, { userId });
  if (!deliveryProviderId) throw new InvalidIdError({ deliveryProviderId });
  return DeliveryProviders.findProvider({ deliveryProviderId });
}
