import { Context, Root } from '@unchainedshop/types/api';
import { log } from 'meteor/unchained:logger';
import { DeliverProviderNotFoundError, InvalidIdError } from '../../../errors';

export default async function removeDeliveryProvider(
  root: Root,
  { deliveryProviderId }: { deliveryProviderId: string },
  { modules, userId }: Context
) {
  log(`mutation removeDeliveryProvider ${deliveryProviderId}`, { userId });

  if (!deliveryProviderId) throw new InvalidIdError({ deliveryProviderId });

  const provider = await modules.delivery.findProvider({ deliveryProviderId });
  if (!provider) throw new DeliverProviderNotFoundError({ deliveryProviderId });

  return modules.delivery.delete(deliveryProviderId, userId);
}
