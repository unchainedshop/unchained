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

  return WarehousingDirector.getAdapters({
    adapterFilter: (Adapter) => Adapter.typeSupported(type),
  }).map((Adapter) => ({
    _id: Adapter.key,
    label: Adapter.label,
    version: Adapter.version,
  }));
}
