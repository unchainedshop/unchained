import { ProductStatus } from '@unchainedshop/core-products';
import { updateCalculationService } from './updateCalculation.ts';
import type { Modules } from '../modules.ts';

export async function removeProductService(
  this: Modules,
  { productId }: { productId: string },
): Promise<boolean> {
  const product = await this.products.findProduct({ productId });

  switch (product?.status) {
    case ProductStatus.ACTIVE:
      await this.products.unpublish(product);
    // falls through
    case null:
    case ProductStatus.DRAFT:
      {
        await this.bookmarks.deleteByProductId(productId);
        await this.assortments.products.deleteMany({ productId });
        await this.products.removeAllAssignmentsAndBundleItems(productId);
        const orderIdsToRecalculate =
          await this.orders.positions.removeProductByIdFromAllOpenPositions(productId);
        await Promise.all(
          [...new Set(orderIdsToRecalculate)].map(async (orderIdToRecalculate) => {
            await updateCalculationService.bind(this)(orderIdToRecalculate);
          }),
        );
        await this.products.delete(productId);
      }
      break;
    case ProductStatus.DELETED:
      // Already deleted
      return false;
    default:
      throw new Error(`Invalid status: ${product?.status}`);
  }

  return true;
}
