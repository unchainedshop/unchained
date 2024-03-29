import { Context, Root } from '@unchainedshop/types/api.js';
import { DeliveryProvider } from '@unchainedshop/types/delivery.js';
import { log } from '@unchainedshop/logger';
import { ProviderConfigurationInvalid } from '../../../errors.js';

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
