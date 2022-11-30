import { RemoveProductService } from '@unchainedshop/types/products';
import { ProductStatus } from '../db/ProductStatus';

export const removeProductService: RemoveProductService = async ({ productId }, { modules }) => {
  const product = await modules.products.findProduct({ productId });
  switch (product.status) {
    case ProductStatus.ACTIVE:
      await modules.products.unpublish(product);
    // falls through
    case null:
    case ProductStatus.DRAFT:
      await modules.bookmarks.deleteByProductId(productId);
      await modules.assortments.products.delete(productId, {});
      await modules.products.delete(productId);
      break;
    default:
      throw new Error(`Invalid status', ${product.status}`);
  }

  return true;
};
