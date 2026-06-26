import type { Modules } from '../modules.ts';
import { removeProductService } from './removeProduct.ts';
import { executeBulkOperation } from './executeBulkOperation.ts';

export async function bulkRemoveProductsService(
  this: Modules,
  { productIds }: { productIds: string[] },
): Promise<{ successIds: string[]; failedIds: string[] }> {
  return executeBulkOperation(productIds, async (productId) => {
    const result = await removeProductService.call(this, { productId });
    if (!result) throw new Error('already-deleted');
  });
}
