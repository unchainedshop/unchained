import type { Context } from '../../../context.ts';
import { log } from '@unchainedshop/logger';
import { createBulkOperationResult, normalizeBulkIds } from './bulkOperation.ts';

export default async function bulkUpdateProductTags(
  root: never,
  { productIds, add, remove }: { productIds: string[]; add?: string[]; remove?: string[] },
  { modules, userId }: Context,
) {
  log(`mutation bulkUpdateProductTags for ${productIds.length} products`, { userId });

  const result = await modules.products.bulkUpdateTags(normalizeBulkIds(productIds), { add, remove });
  return createBulkOperationResult(result);
}
