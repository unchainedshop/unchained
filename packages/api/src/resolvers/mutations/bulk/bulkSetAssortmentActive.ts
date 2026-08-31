import type { Context } from '../../../context.ts';
import { log } from '@unchainedshop/logger';
import { createBulkOperationResult, normalizeBulkIds } from './bulkOperation.ts';

export default async function bulkSetAssortmentActive(
  root: never,
  { assortmentIds, isActive }: { assortmentIds: string[]; isActive: boolean },
  { modules, userId }: Context,
) {
  log(`mutation bulkSetAssortmentActive ${isActive} for ${assortmentIds.length} assortments`, {
    userId,
  });

  const result = await modules.assortments.bulkSetActive(normalizeBulkIds(assortmentIds), isActive);
  return createBulkOperationResult(result);
}
