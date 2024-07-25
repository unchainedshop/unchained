import { log } from '@unchainedshop/logger';
import { Context } from '../../../types.js';

export default async function reorderAssortmentMedia(
  root: never,
  params: { sortKeys: Array<{ assortmentMediaId: string; sortKey: number }> },
  { modules, userId }: Context,
) {
  log('mutation reorderAssortmentMedia', { userId });
  return modules.assortments.media.updateManualOrder({
    sortKeys: params.sortKeys,
  });
}
