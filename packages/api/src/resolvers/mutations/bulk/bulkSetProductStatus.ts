import type { Context } from '../../../context.ts';
import { log } from '@unchainedshop/logger';

export default async function bulkSetProductStatus(
  root: never,
  { productIds, status }: { productIds: string[]; status: string },
  { modules, userId }: Context,
) {
  log(`mutation bulkSetProductStatus ${status} for ${productIds.length} products`, { userId });

  const failedIds: string[] = [];
  let successCount = 0;

  for (const productId of productIds) {
    try {
      const product = await modules.products.findProduct({ productId });
      if (!product) {
        failedIds.push(productId);
        continue;
      }

      if (status === 'ACTIVE') {
        const result = await modules.products.publish(product);
        if (!result) {
          failedIds.push(productId);
          continue;
        }
      } else if (status === 'DRAFT') {
        const result = await modules.products.unpublish(product);
        if (!result) {
          failedIds.push(productId);
          continue;
        }
      } else {
        failedIds.push(productId);
        continue;
      }
      successCount += 1;
    } catch {
      failedIds.push(productId);
    }
  }

  return { successCount, failedCount: failedIds.length, failedIds };
}
