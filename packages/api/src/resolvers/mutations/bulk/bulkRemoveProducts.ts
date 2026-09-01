import type { Context } from '../../../context.ts';
import { log } from '@unchainedshop/logger';
import { createBulkOperationResult, normalizeBulkIds } from './bulkOperation.ts';

export default async function bulkRemoveProducts(
  root: never,
  { productIds }: { productIds: string[] },
  { services, userId }: Context,
) {
  log(`mutation bulkRemoveProducts for ${productIds.length} products`, { userId });

  const result = await services.products.bulkRemoveProducts({
    productIds: normalizeBulkIds(productIds),
  });
  return createBulkOperationResult(result);
}
