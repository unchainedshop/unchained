import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';

export default async function reorderAssortmentMedia(
  root: Root,
  params: { sortKeys: Array<{ assortmentMediaId: string; sortKey: number }> },
  { modules, userId }: Context
) {
  log('mutation reorderAssortmentMedia', { modules, userId });
  return await modules.assortments.media.updateManualOrder({
    sortKeys: params.sortKeys,
  });
}
