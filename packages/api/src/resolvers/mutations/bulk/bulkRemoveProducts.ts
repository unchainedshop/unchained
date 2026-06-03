import type { Context } from '../../../context.ts';
import { log } from '@unchainedshop/logger';

export default async function bulkRemoveProducts(
  root: never,
  { productIds }: { productIds: string[] },
  { modules, services, userId }: Context,
) {
  log(`mutation bulkRemoveProducts for ${productIds.length} products`, { userId });

  const failedIds: string[] = [];
  let successCount = 0;

  for (const productId of productIds) {
    try {
      if (!(await modules.products.productExists({ productId }))) {
        failedIds.push(productId);
        continue;
      }
      const result = await services.products.removeProduct({ productId });
      if (result) {
        successCount += 1;
      } else {
        failedIds.push(productId);
      }
    } catch {
      failedIds.push(productId);
    }
  }

  return { successCount, failedCount: failedIds.length, failedIds };
}
