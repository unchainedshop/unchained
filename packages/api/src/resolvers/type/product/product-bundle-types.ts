import { BundleProductHelperTypes } from '@unchainedshop/types/products.js';
import { Product } from './product-types.js';

export const BundleProduct: BundleProductHelperTypes = {
  ...Product,

  bundleItems(product) {
    return product.bundleItems ? product.bundleItems : [];
  },
};
