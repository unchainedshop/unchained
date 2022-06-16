import { Context, Root } from '@unchainedshop/types/api';
import { DeliveryProviderType } from '@unchainedshop/types/delivery';
import { log } from '@unchainedshop/logger';

export default function deliveryInterfaces(
  root: Root,
  { type }: { type: DeliveryProviderType },
  { modules, userId }: Context,
) {
  log(`query deliveryInterfaces ${type}`, { userId });

  return modules.delivery.findInterfaces({ type });
}
