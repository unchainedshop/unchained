import type { ProductBundleItem } from '@unchainedshop/core-products';
import { PlanProduct } from './product-plan-types.ts';

export const BundleProduct = {
  ...PlanProduct,

  bundleItems(product): ProductBundleItem[] {
    return product.bundleItems ? product.bundleItems : [];
  },
};
