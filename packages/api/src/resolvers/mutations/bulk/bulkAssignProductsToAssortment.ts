import type { Context } from '../../../context.ts';
import { log } from '@unchainedshop/logger';
import { InvalidIdError, AssortmentNotFoundError } from '../../../errors.ts';
import { createBulkOperationResult, normalizeBulkIds } from './bulkOperation.ts';

export default async function bulkAssignProductsToAssortment(
  root: never,
  { productIds, assortmentId }: { productIds: string[]; assortmentId: string },
  { modules, services, userId }: Context,
) {
  log(`mutation bulkAssignProductsToAssortment ${assortmentId} for ${productIds.length} products`, {
    userId,
  });

  const normalizedProductIds = normalizeBulkIds(productIds);
  if (!assortmentId) throw new InvalidIdError({ assortmentId });
  if (!(await modules.assortments.assortmentExists({ assortmentId })))
    throw new AssortmentNotFoundError({ assortmentId });

  const result = await services.assortments.bulkAssignProductsToAssortment({
    assortmentId,
    productIds: normalizedProductIds,
  });
  return createBulkOperationResult(result);
}
