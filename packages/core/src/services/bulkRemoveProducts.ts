import type { Modules } from '../modules.ts';
import { removeProductService } from './removeProduct.ts';

export async function bulkRemoveProductsService(
  this: Modules,
  { productIds }: { productIds: string[] },
): Promise<{ successIds: string[]; failedIds: string[] }> {
  const successIds: string[] = [];
  const failedIds: string[] = [];

  const results = await Promise.allSettled(
    productIds.map(async (productId) => {
      const result = await removeProductService.call(this, { productId });
      if (!result) throw new Error('already-deleted');
      return productId;
    }),
  );

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      successIds.push(result.value);
    } else {
      failedIds.push(productIds[index]);
    }
  });

  return { successIds, failedIds };
}
