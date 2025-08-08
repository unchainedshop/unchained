import { WarehousingDirector } from '@unchainedshop/core';
import { Context } from '../../../context.js';
import { WarehousingProviderType } from '@unchainedshop/core-warehousing';
import { log } from '@unchainedshop/logger';

export default async function warehousingInterfaces(
  root: never,
  { type }: { type: WarehousingProviderType },
  { userId }: Context,
) {
  log(`query warehousingInterfaces ${type}`, { userId });
  const allAdapters = await WarehousingDirector.getAdapters();
  const filteredAdapters = type
    ? allAdapters.filter((Adapter) => Adapter.typeSupported(type as WarehousingProviderType))
    : allAdapters;

  return filteredAdapters.map((Adapter) => ({
    _id: Adapter.key,
    label: Adapter.label,
    version: Adapter.version,
  }));
}
