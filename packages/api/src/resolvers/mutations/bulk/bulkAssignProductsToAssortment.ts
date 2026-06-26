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

  const results = await Promise.allSettled(
    productIds.map(async (productId) => {
      if (!(await modules.products.productExists({ productId }))) throw new Error('not-found');
      await modules.assortments.products.create({ assortmentId, productId, tags: [] });
    }),
  );

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      successCount += 1;
    } else {
      failedIds.push(productIds[index]);
    }
  });

  return { successCount, failedCount: failedIds.length, failedIds };
}
