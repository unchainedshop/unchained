import { log } from '@unchainedshop/logger';
import { Context } from '../../../types.js';
import { DeliveryProvider } from '@unchainedshop/types/delivery.js';
import { DeliverProviderNotFoundError, InvalidIdError } from '../../../errors.js';

export default async function updateDeliveryProvider(
  root: never,
  params: { deliveryProvider: DeliveryProvider; deliveryProviderId: string },
  { modules, userId }: Context,
) {
  const { deliveryProvider, deliveryProviderId } = params;

  log(`mutation updateDeliveryProvider ${deliveryProviderId}`, { userId });

  if (!deliveryProviderId) throw new InvalidIdError({ deliveryProviderId });

  if (!(await modules.delivery.providerExists({ deliveryProviderId })))
    throw new DeliverProviderNotFoundError({ deliveryProviderId });

  return modules.delivery.update(deliveryProviderId, deliveryProvider);
}
