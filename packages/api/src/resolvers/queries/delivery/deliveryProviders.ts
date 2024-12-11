import { log } from '@unchainedshop/logger';
import { Context } from '../../../context.js';
import { DeliveryProviderType } from '@unchainedshop/core-delivery';

export default async function deliveryProviders(
  root: never,
  params: {
    type?: DeliveryProviderType;
  },
  { modules, userId }: Context,
) {
  log(`query deliveryProviders ${params.type}`, { userId });

  return modules.delivery.findProviders(params);
}
