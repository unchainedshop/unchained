import type { Context } from '../../../context.ts';
import type { DeliveryProvider } from '@unchainedshop/core-delivery';
import { log } from '@unchainedshop/logger';
import { ProviderConfigurationInvalid } from '../../../errors.ts';
import { DeliveryDirector } from '@unchainedshop/core';

export default async function createDeliveryProvider(
  root: never,
  { deliveryProvider }: { deliveryProvider: Pick<DeliveryProvider, 'type' | 'adapterKey'> },
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
