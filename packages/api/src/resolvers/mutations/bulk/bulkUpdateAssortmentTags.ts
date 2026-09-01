import type { Context } from '../../../context.ts';
import { log } from '@unchainedshop/logger';
import { createBulkOperationResult, normalizeBulkIds } from './bulkOperation.ts';

export default async function bulkUpdateAssortmentTags(
  root: never,
  { assortmentIds, add, remove }: { assortmentIds: string[]; add?: string[]; remove?: string[] },
  { modules, userId }: Context,
) {
  log(`mutation bulkUpdateAssortmentTags for ${assortmentIds.length} assortments`, { userId });

  const result = await modules.assortments.bulkUpdateTags(normalizeBulkIds(assortmentIds), {
    add,
    remove,
  });
  return createBulkOperationResult(result);
}
