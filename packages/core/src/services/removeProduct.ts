import { ProductStatus } from '@unchainedshop/core-products';
import { updateCalculationService } from './updateCalculation.js';
import { Modules } from '../modules.js';

export const removeProductService = async (
  { productId }: { productId: string },
  unchainedAPI: { modules: Modules },
): Promise<boolean> => {
  const { modules } = unchainedAPI;
  const product = await modules.products.findProduct({ productId });
  switch (product.status) {
    case ProductStatus.ACTIVE:
      await modules.products.unpublish(product);
    // falls through
    case null:
    case ProductStatus.DRAFT:
      {
        await modules.bookmarks.deleteByProductId(productId);
        await modules.assortments.products.delete(productId);
        const orderIdsToRecalculate =
          await modules.orders.positions.removeProductByIdFromAllOpenPositions(productId);
        await Promise.all(
          [...new Set(orderIdsToRecalculate)].map(async (orderIdToRecalculate) => {
            await updateCalculationService(orderIdToRecalculate, unchainedAPI);
          }),
        );
        await modules.products.delete(productId);
      }
      break;
    default:
      throw new Error(`Invalid status', ${product.status}`);
  }

  return true;
};
