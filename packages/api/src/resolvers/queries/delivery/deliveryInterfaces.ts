import { Context } from '../../../types.js';
import { DeliveryProviderType } from '@unchainedshop/core-delivery';
import { log } from '@unchainedshop/logger';

export default function deliveryInterfaces(
  root: never,
  { type }: { type: DeliveryProviderType },
  { modules, userId }: Context,
) {
  log(`query deliveryInterfaces ${type}`, { userId });

  return modules.delivery.findInterfaces({ type });
}
