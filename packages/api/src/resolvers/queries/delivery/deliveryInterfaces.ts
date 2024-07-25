import { Context } from '../../../types.js';
import { DeliveryProviderType } from '@unchainedshop/types/delivery.js';
import { log } from '@unchainedshop/logger';

export default function deliveryInterfaces(
  root: never,
  { type }: { type: DeliveryProviderType },
  { modules, userId }: Context,
) {
  log(`query deliveryInterfaces ${type}`, { userId });

  return modules.delivery.findInterfaces({ type });
}
