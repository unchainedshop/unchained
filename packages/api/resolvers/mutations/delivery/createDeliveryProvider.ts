import { Context, Root } from '@unchainedshop/types/api';
import { DeliveryProvider } from '@unchainedshop/types/delivery';
import { log } from 'meteor/unchained:logger';
import { ProviderConfigurationInvalid } from '../../../errors';

export default async function createDeliveryProvider(
  root: Root,
  { deliveryProvider }: { deliveryProvider: DeliveryProvider },
  { modules, userId }: Context
) {
  log('mutation createDeliveryProvider', { userId });

  const providerId = await modules.delivery.create({
    ...deliveryProvider,
    authorId: userId,
  }, userId);

  if (!providerId) throw new ProviderConfigurationInvalid(deliveryProvider);


  return await modules.delivery.findProvider({ deliveryProviderId: providerId });
}
