import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api.js';
import { DeliveryProviderQuery } from '@unchainedshop/types/delivery.js';

export default async function deliveryProviders(
  root: Root,
  params: DeliveryProviderQuery,
  { modules, userId }: Context,
) {
  log(`query deliveryProviders ${params.type}`, { userId });

  return modules.delivery.findProviders(params);
}
