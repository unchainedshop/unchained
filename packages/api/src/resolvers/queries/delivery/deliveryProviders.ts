import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';
import { DeliveryProviderQuery } from '@unchainedshop/types/delivery';

export default async function deliveryProviders(
  root: Root,
  params: DeliveryProviderQuery,
  { modules, userId }: Context,
) {
  log(`query deliveryProviders ${params.type}`, { userId });

  return modules.delivery.findProviders(params);
}
