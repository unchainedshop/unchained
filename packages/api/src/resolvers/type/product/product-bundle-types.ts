import { ProductBundleItem } from '@unchainedshop/core-products';
import { PlanProduct } from './product-plan-types.js';

export const BundleProduct = {
  ...PlanProduct,

  bundleItems(product): ProductBundleItem[] {
    return product.bundleItems ? product.bundleItems : [];
  },
};
