import { log } from '@unchainedshop/logger';
import { Context } from '../../../context.js';
import { DeliveryProviderQuery } from '@unchainedshop/core-delivery';

export default async function deliveryProvidersCount(
  root: never,
  params: DeliveryProviderQuery,
  { modules, userId }: Context,
) {
  log(`query deliveryProvidersCount ${params.type}`, { userId });

  return modules.delivery.count(params);
}
