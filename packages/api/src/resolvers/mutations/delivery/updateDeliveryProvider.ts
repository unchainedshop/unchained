import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';
import type { DeliveryProvider } from '@unchainedshop/core-delivery';
import { DeliverProviderNotFoundError, InvalidIdError } from '../../../errors.ts';

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
