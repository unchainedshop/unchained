import { log } from '@unchainedshop/logger';
import { Context } from '../../../types.js';
import { DeliveryProviderQuery } from '@unchainedshop/core-delivery';

export default async function deliveryProviders(
  root: never,
  params: DeliveryProviderQuery,
  { modules, userId }: Context,
) {
  log(`query deliveryProviders ${params.type}`, { userId });

  return modules.delivery.findProviders(params);
}
