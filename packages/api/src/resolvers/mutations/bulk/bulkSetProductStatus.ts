import type { Context } from '../../../context.ts';
import { log } from '@unchainedshop/logger';

export default async function bulkSetProductStatus(
  root: never,
  { productIds, status }: { productIds: string[]; status: string },
  { modules, userId }: Context,
) {
  log(`mutation bulkSetProductStatus ${status} for ${productIds.length} products`, { userId });

  let successIds: string[];

  if (status === 'ACTIVE') {
    successIds = await modules.products.bulkPublish(productIds);
  } else if (status === 'DRAFT') {
    successIds = await modules.products.bulkUnpublish(productIds);
  } else {
    return { successCount: 0, failedCount: productIds.length, failedIds: productIds };
  }

  const failedIds = productIds.filter((id) => !successIds.includes(id));
  return { successCount: successIds.length, failedCount: failedIds.length, failedIds };
}
