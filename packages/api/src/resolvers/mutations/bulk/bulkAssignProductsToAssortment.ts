import type { Context } from '../../../context.ts';
import { log } from '@unchainedshop/logger';
import { InvalidIdError, AssortmentNotFoundError } from '../../../errors.ts';

export default async function bulkAssignProductsToAssortment(
  root: never,
  { productIds, assortmentId }: { productIds: string[]; assortmentId: string },
  { modules, userId }: Context,
) {
  log(`mutation bulkAssignProductsToAssortment ${assortmentId} for ${productIds.length} products`, {
    userId,
  });

  if (!assortmentId) throw new InvalidIdError({ assortmentId });
  if (!(await modules.assortments.assortmentExists({ assortmentId })))
    throw new AssortmentNotFoundError({ assortmentId });

  const failedIds: string[] = [];
  let successCount = 0;

  for (const productId of productIds) {
    try {
      if (!(await modules.products.productExists({ productId }))) {
        failedIds.push(productId);
        continue;
      }
      await modules.assortments.products.create({ assortmentId, productId, tags: [] });
      successCount += 1;
    } catch {
      failedIds.push(productId);
    }
  }

  return { successCount, failedCount: failedIds.length, failedIds };
}
