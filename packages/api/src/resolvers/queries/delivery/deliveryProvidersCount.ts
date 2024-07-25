import { log } from '@unchainedshop/logger';
import { Context } from '../../../types.js';
import { DeliveryProviderQuery } from '@unchainedshop/types/delivery.js';

export default async function deliveryProvidersCount(
  root: never,
  params: DeliveryProviderQuery,
  { modules, userId }: Context,
) {
  log(`query deliveryProvidersCount ${params.type}`, { userId });

  return modules.delivery.count(params);
}
