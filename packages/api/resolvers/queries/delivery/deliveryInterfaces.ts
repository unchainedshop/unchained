import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';
import { DeliveryProvider } from '@unchainedshop/types/delivery';
import { DeliveryProviderType } from '@unchainedshop/types/delivery';

export default async function deliveryInterfaces(
  root: Root,
  { type }: { type: DeliveryProviderType },
  { modules, userId }: Context
) {
  log(`query deliveryInterfaces ${type}`, { userId });

  return await modules.delivery.findInterfaces({ type });
}
