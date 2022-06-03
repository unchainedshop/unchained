import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';
import { DeliveryProviderQuery } from '@unchainedshop/types/delivery';

export default async function deliveryProvidersCount(
  root: Root,
  { type }: DeliveryProviderQuery,
  { modules, userId }: Context,
) {
  log(`query deliveryProvidersCount ${type}`, { userId });

  return modules.delivery.count({ type });
}
