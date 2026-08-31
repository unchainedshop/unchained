import type { Modules } from '../modules.ts';
import { executeBulkOperation } from '@unchainedshop/utils';

export async function bulkAssignProductsToAssortmentService(
  this: Modules,
  { assortmentId, productIds }: { assortmentId: string; productIds: string[] },
): Promise<{ successIds: string[]; failedIds: string[] }> {
  const result = await executeBulkOperation(productIds, async (productId) => {
    if (!(await this.products.productExists({ productId }))) throw new Error('not-found');
    const assignment = await this.assortments.products.create({ assortmentId, productId });
    if (!assignment) throw new Error('create-failed');
  });
  return result;
}
