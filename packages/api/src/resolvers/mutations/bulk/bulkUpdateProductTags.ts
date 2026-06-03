import type { Context } from '../../../context.ts';
import { log } from '@unchainedshop/logger';

export default async function bulkUpdateProductTags(
  root: never,
  { productIds, add, remove }: { productIds: string[]; add?: string[]; remove?: string[] },
  { modules, userId }: Context,
) {
  log(`mutation bulkUpdateProductTags for ${productIds.length} products`, { userId });

  if (remove?.length) {
    await modules.products.bulkRemoveTags(productIds, remove);
  }
  if (add?.length) {
    await modules.products.bulkAddTags(productIds, add);
  }

  return { successCount: productIds.length, failedCount: 0, failedIds: [] };
}
