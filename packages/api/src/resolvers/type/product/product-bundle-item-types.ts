import { ProductBundleItemHelperTypes } from '@unchainedshop/types/products';

export const ProductBundleItem: ProductBundleItemHelperTypes = {
  product: async (productItem, _, { loaders }) => {
    const product = await loaders.productLoader.load({
      productId: productItem.productId,
      includeDrafts: true,
    });
    return product;
  },
};
