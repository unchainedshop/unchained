import { ProductBundleItem } from '@unchainedshop/core-products';
import { Product } from './product-types.js';

export const BundleProduct = {
  ...Product,

  bundleItems(product): Array<ProductBundleItem> {
    return product.bundleItems ? product.bundleItems : [];
  },
};
