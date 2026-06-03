import type { Context } from '../../../context.ts';
import { log } from '@unchainedshop/logger';

export default async function bulkRemoveProducts(
  root: never,
  { productIds }: { productIds: string[] },
  { services, userId }: Context,
) {
  log(`mutation bulkRemoveProducts for ${productIds.length} products`, { userId });

  const { successIds, failedIds } = await services.products.bulkRemoveProducts({ productIds });

  return { successCount: successIds.length, failedCount: failedIds.length, failedIds };
}
