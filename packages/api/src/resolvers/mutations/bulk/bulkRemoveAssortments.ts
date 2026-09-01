import type { Context } from '../../../context.ts';
import { log } from '@unchainedshop/logger';
import { createBulkOperationResult, normalizeBulkIds } from './bulkOperation.ts';

export default async function bulkRemoveAssortments(
  root: never,
  { assortmentIds }: { assortmentIds: string[] },
  { modules, userId }: Context,
) {
  log(`mutation bulkRemoveAssortments for ${assortmentIds.length} assortments`, { userId });

  const result = await modules.assortments.bulkDelete(normalizeBulkIds(assortmentIds));
  return createBulkOperationResult(result);
}
