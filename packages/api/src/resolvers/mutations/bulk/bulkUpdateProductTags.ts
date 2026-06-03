import type { Context } from '../../../context.ts';
import { log } from '@unchainedshop/logger';

export default async function bulkUpdateProductTags(
  root: never,
  { productIds, add, remove }: { productIds: string[]; add?: string[]; remove?: string[] },
  { modules, userId }: Context,
) {
  log(`mutation bulkUpdateProductTags for ${productIds.length} products`, { userId });

  const failedIds: string[] = [];
  let successCount = 0;

  for (const productId of productIds) {
    try {
      const product = await modules.products.findProduct({ productId });
      if (!product) {
        failedIds.push(productId);
        continue;
      }

      let tags = product.tags || [];
      if (remove?.length) {
        tags = tags.filter((t) => !remove.includes(t));
      }
      if (add?.length) {
        tags = [...new Set([...tags, ...add])];
      }

      await modules.products.update(productId, { tags });
      successCount += 1;
    } catch {
      failedIds.push(productId);
    }
  }

  return { successCount, failedCount: failedIds.length, failedIds };
}
