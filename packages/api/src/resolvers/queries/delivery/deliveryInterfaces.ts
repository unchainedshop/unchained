import { Context, Root } from '@unchainedshop/types/api.js';
import { DeliveryProviderType } from '@unchainedshop/types/delivery.js';
import { log } from '@unchainedshop/logger';

export default function deliveryInterfaces(
  root: Root,
  { type }: { type: DeliveryProviderType },
  { modules, userId }: Context,
) {
  log(`query deliveryInterfaces ${type}`, { userId });

  return modules.delivery.findInterfaces({ type });
}
