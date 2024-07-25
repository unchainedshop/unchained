/* eslint-disable no-case-declarations */
import { RemoveProductService } from '@unchainedshop/types/products.js';
import { ProductStatus } from '../db/ProductStatus.js';

export const removeProductService: RemoveProductService = async ({ productId }, unchainedAPI) => {
  const { modules } = unchainedAPI;
  const product = await modules.products.findProduct({ productId });
  switch (product.status) {
    case ProductStatus.ACTIVE:
      await modules.products.unpublish(product);
    // falls through
    case null:
    case ProductStatus.DRAFT:
      await modules.bookmarks.deleteByProductId(productId);
      await modules.assortments.products.delete(productId);
      const orderIdsToRecalculate = await modules.orders.positions.removeProductByIdFromAllOpenPositions(
        productId,
        unchainedAPI,
      );
      await Promise.all(
        [...new Set(orderIdsToRecalculate)].map(async (orderIdToRecalculate) => {
          await modules.orders.updateCalculation(orderIdToRecalculate, unchainedAPI);
        }),
      );
      await modules.products.delete(productId);
      break;
    default:
      throw new Error(`Invalid status', ${product.status}`);
  }

  return true;
};
