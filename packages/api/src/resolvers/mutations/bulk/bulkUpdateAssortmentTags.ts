import type { Context } from '../../../context.ts';
import { log } from '@unchainedshop/logger';

export default async function bulkUpdateAssortmentTags(
  root: never,
  { assortmentIds, add, remove }: { assortmentIds: string[]; add?: string[]; remove?: string[] },
  { modules, userId }: Context,
) {
  log(`mutation bulkUpdateAssortmentTags for ${assortmentIds.length} assortments`, { userId });

  if (remove?.length) {
    await modules.assortments.bulkRemoveTags(assortmentIds, remove);
  }
  if (add?.length) {
    await modules.assortments.bulkAddTags(assortmentIds, add);
  }

  await modules.assortments.invalidateCache({ assortmentIds }, { skipUpstreamTraversal: false });

  return { successCount: assortmentIds.length, failedCount: 0, failedIds: [] };
}
