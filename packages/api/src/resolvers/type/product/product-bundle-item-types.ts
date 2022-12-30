import { ProductBundleItemHelperTypes } from '@unchainedshop/types/products.js';

export const ProductBundleItem: ProductBundleItemHelperTypes = {
  product: async (productItem, _, { loaders }) => {
    const product = await loaders.productLoader.load({
      productId: productItem.productId,
    });
    return product;
  },
};
