import { Product as IProduct, ProductType } from '@unchainedshop/core-products';

export const ConfigurableOrBundleProduct = {
  __resolveType: (product: IProduct): string => {
    switch (product.type) {
      case ProductType.CONFIGURABLE_PRODUCT:
        return 'ConfigurableProduct';
      case ProductType.BUNDLE_PRODUCT:
        return 'BundleProduct';
      case ProductType.PLAN_PRODUCT:
        return 'PlanProduct';
      case ProductType.TOKENIZED_PRODUCT:
        return 'TokenizedProduct';
      default:
        return 'SimpleProduct';
    }
  },
};
