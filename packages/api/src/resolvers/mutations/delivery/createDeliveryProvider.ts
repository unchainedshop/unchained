import { Context } from '../../../types.js';
import { DeliveryProvider } from '@unchainedshop/core-delivery';
import { log } from '@unchainedshop/logger';
import { ProviderConfigurationInvalid } from '../../../errors.js';

export default async function createDeliveryProvider(
  root: never,
  { deliveryProvider }: { deliveryProvider: DeliveryProvider },
  { modules, userId }: Context,
) {
  log('mutation createDeliveryProvider', { userId });

  const provider = await modules.delivery.create({
    ...deliveryProvider,
  });

  if (!provider) throw new ProviderConfigurationInvalid(deliveryProvider);

  return provider;
}
