import type { Context } from '../../../context.ts';
import { log } from '@unchainedshop/logger';
import { createBulkOperationResult, normalizeBulkIds } from './bulkOperation.ts';

export default async function bulkSetProductStatus(
  root: never,
  { productIds, status }: { productIds: string[]; status: string },
  { modules, userId }: Context,
) {
  log(`mutation bulkSetProductStatus ${status} for ${productIds.length} products`, { userId });

  const normalizedProductIds = normalizeBulkIds(productIds);
  let result: { successIds: string[]; failedIds: string[] };

  if (status === 'ACTIVE') {
    result = await modules.products.bulkPublish(normalizedProductIds);
  } else if (status === 'DRAFT') {
    result = await modules.products.bulkUnpublish(normalizedProductIds);
  } else {
    result = { successIds: [], failedIds: normalizedProductIds };
  }

  return createBulkOperationResult(result);
}
