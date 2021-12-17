import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';
import { DeliveryProviderType } from '@unchainedshop/types/delivery';

export default async function deliveryProviders(
  root: Root,
  { type }: { type: DeliveryProviderType },
  { modules, userId }: Context
) {
  log(`query deliveryProviders ${type}`, { userId });

  return await modules.delivery.findProviders({ type });
}
