import { log } from '@unchainedshop/logger';
import { Context } from '../../../types.js';
import { DeliveryProviderQuery } from '@unchainedshop/types/delivery.js';

export default async function deliveryProviders(
  root: never,
  params: DeliveryProviderQuery,
  { modules, userId }: Context,
) {
  log(`query deliveryProviders ${params.type}`, { userId });

  return modules.delivery.findProviders(params);
}
