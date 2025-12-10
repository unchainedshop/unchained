import { DeliveryDirector } from '@unchainedshop/core';
import type { Context } from '../../../context.ts';
import { DeliveryProviderType } from '@unchainedshop/core-delivery';
import { log } from '@unchainedshop/logger';

export default async function deliveryInterfaces(
  root: never,
  { type }: { type: DeliveryProviderType },
  { userId }: Context,
) {
  log(`query deliveryInterfaces ${type}`, { userId });

  const allAdapters = await DeliveryDirector.getAdapters();

  const filteredAdapters = type
    ? allAdapters.filter((Adapter) => Adapter.typeSupported(type as DeliveryProviderType))
    : allAdapters;

  return filteredAdapters.map((Adapter) => ({
    _id: Adapter.key,
    label: Adapter.label,
    version: Adapter.version,
  }));
}
