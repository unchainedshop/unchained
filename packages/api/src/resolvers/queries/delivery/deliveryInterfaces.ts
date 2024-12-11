import { DeliveryDirector } from '@unchainedshop/core';
import { Context } from '../../../context.js';
import { DeliveryProviderType } from '@unchainedshop/core-delivery';
import { log } from '@unchainedshop/logger';

export default function deliveryInterfaces(
  root: never,
  { type }: { type: DeliveryProviderType },
  { userId }: Context,
) {
  log(`query deliveryInterfaces ${type}`, { userId });

  return DeliveryDirector.getAdapters({
    adapterFilter: (Adapter) => Adapter.typeSupported(type),
  }).map((Adapter) => ({
    _id: Adapter.key,
    label: Adapter.label,
    version: Adapter.version,
  }));
}
