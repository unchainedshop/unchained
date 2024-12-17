import { Context } from '../../../context.js';
import { DeliveryProvider } from '@unchainedshop/core-delivery';
import { log } from '@unchainedshop/logger';
import { ProviderConfigurationInvalid } from '../../../errors.js';
import { DeliveryDirector } from '@unchainedshop/core';

export default async function createDeliveryProvider(
  root: never,
  { deliveryProvider }: { deliveryProvider: DeliveryProvider },
  { modules, userId }: Context,
) {
  log('mutation createDeliveryProvider', { userId });

  const Adapter = DeliveryDirector.getAdapter(deliveryProvider.adapterKey);
  if (!Adapter) return null;

  const provider = await modules.delivery.create({
    configuration: Adapter.initialConfiguration,
    ...deliveryProvider,
  });

  if (!provider) throw new ProviderConfigurationInvalid(deliveryProvider);

  return provider;
}
