import { BundleProductHelperTypes } from '@unchainedshop/types/products';
import { Product } from './product-types';

export const BundleProduct: BundleProductHelperTypes = {
  ...Product,

  bundleItems(product) {
    return product.bundleItems ? product.bundleItems : [];
  },
};
