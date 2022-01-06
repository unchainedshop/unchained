import { Context } from '@unchainedshop/types/api';
import { ProductStatus } from '../db/ProductStatus';

export type RemoveProductService = (
  params: { productId: string },
  context: Context
) => Promise<boolean>;

export const removeProductService: RemoveProductService = async (
  { productId },
  { modules, userId }
) => {
  const product = await modules.products.findProduct({ productId });
  switch (product.status) {
    case ProductStatus.ACTIVE:
      await modules.products.unpublish(product, userId);

    // falls through
    case ProductStatus.DRAFT:
      await modules.assortments.products.delete(productId);
      await modules.products.delete(productId, userId);
      break;
    default:
      throw new Error(`Invalid status', ${product.status}`);
  }

  return true;
};
