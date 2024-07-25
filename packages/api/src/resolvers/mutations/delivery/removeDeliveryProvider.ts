import { Context } from '../../../types.js';
import { log } from '@unchainedshop/logger';
import { DeliverProviderNotFoundError, InvalidIdError } from '../../../errors.js';

export default async function removeDeliveryProvider(
  root: never,
  { deliveryProviderId }: { deliveryProviderId: string },
  { modules, userId }: Context,
) {
  log(`mutation removeDeliveryProvider ${deliveryProviderId}`, { userId });

  if (!deliveryProviderId) throw new InvalidIdError({ deliveryProviderId });

  const provider = await modules.delivery.findProvider({ deliveryProviderId });
  if (!provider) throw new DeliverProviderNotFoundError({ deliveryProviderId });

  return modules.delivery.delete(deliveryProviderId);
}
