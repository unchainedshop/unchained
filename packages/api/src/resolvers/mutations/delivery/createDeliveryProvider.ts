import { Context, Root } from '@unchainedshop/types/api';
import { DeliveryProvider } from '@unchainedshop/types/delivery';
import { log } from '@unchainedshop/logger';
import { ProviderConfigurationInvalid } from '../../../errors';

export default async function createDeliveryProvider(
  root: Root,
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
