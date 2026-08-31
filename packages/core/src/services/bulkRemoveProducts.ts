import type { Modules } from '../modules.ts';
import { executeBulkOperation } from '@unchainedshop/utils';
import { removeProductService } from './removeProduct.ts';

export async function bulkRemoveProductsService(
  this: Modules,
  { productIds }: { productIds: string[] },
): Promise<{ successIds: string[]; failedIds: string[] }> {
  return executeBulkOperation(productIds, async (productId) => {
    if (!(await this.products.productExists({ productId }))) throw new Error('not-found');
    if (await this.products.firstActiveProductBundle(productId)) {
      throw new Error('linked-to-active-bundle');
    }
    if (await this.products.firstActiveProductProxy(productId)) {
      throw new Error('linked-to-active-variation');
    }
    if (await this.quotations.openQuotationWithProduct({ productId })) {
      throw new Error('linked-to-quotation');
    }
    if (await this.enrollments.openEnrollmentWithProduct({ productId })) {
      throw new Error('linked-to-enrollment');
    }

    const result = await removeProductService.call(this, { productId });
    if (!result) throw new Error('already-deleted');
  });
}
