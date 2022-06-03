import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';
import { DeliveryProviderQuery } from '@unchainedshop/types/delivery';

export default async function deliveryProviders(
  root: Root,
  { type }: DeliveryProviderQuery,
  { modules, userId }: Context,
) {
  log(`query deliveryProviders ${type}`, { userId });

  return modules.delivery.findProviders({ type });
}
