import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api';
import { DeliveryProviderQuery } from '@unchainedshop/types/delivery';

export default async function deliveryProvidersCount(
  root: Root,
  params: DeliveryProviderQuery,
  { modules, userId }: Context,
) {
  log(`query deliveryProvidersCount ${params.type}`, { userId });

  return modules.delivery.count(params);
}
