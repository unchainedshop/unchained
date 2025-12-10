import type { Product, ProductBundleItem as ProductBundleItemType } from '@unchainedshop/core-products';
import type { Context } from '../../../context.ts';

export interface ProductBundleItemHelperTypes {
  product: (bundleItem: ProductBundleItemType, _: never, context: Context) => Promise<Product>;
}

export const ProductBundleItem: ProductBundleItemHelperTypes = {
  product: async (productItem, _, { loaders }) => {
    const product = await loaders.productLoader.load({
      productId: productItem.productId,
    });
    return product;
  },
};
