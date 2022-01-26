import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';
import { DeliveryProviderType } from '@unchainedshop/types/delivery';

export default async function deliveryProvidersCount(
  root: Root,
  { type }: { type: DeliveryProviderType },
  { modules, userId }: Context
) {
  log(`query deliveryProvidersCount ${type}`, { userId });

  return modules.delivery.count({ type });
}
