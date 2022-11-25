import { RemoveProductService } from '@unchainedshop/types/products';
import { ProductStatus } from '../db/ProductStatus';

export const removeProductService: RemoveProductService = async ({ productId, userId }, { modules }) => {
  const product = await modules.products.findProduct({ productId });
  switch (product.status) {
    case ProductStatus.ACTIVE:
      await modules.products.unpublish(product, userId);
    // falls through
    case null:
    case ProductStatus.DRAFT:
      await modules.bookmarks.deleteByProductId(productId);
      await modules.assortments.products.delete(productId, {}, userId);
      await modules.products.delete(productId, userId);
      break;
    default:
      throw new Error(`Invalid status', ${product.status}`);
  }

  return true;
};
