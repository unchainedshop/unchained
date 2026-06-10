import { ProductType } from '@unchainedshop/core-products';

const productTypeMap: Record<string, string> = {
  [ProductType.CONFIGURABLE_PRODUCT]: 'ConfigurableProduct',
  [ProductType.BUNDLE_PRODUCT]: 'BundleProduct',
  [ProductType.PLAN_PRODUCT]: 'PlanProduct',
  [ProductType.TOKENIZED_PRODUCT]: 'TokenizedProduct',
};

export const GlobalSearchResult = {
  __resolveType(obj: Record<string, any>): string {
    if (obj.__typename === 'Product') {
      return productTypeMap[obj.type] || 'SimpleProduct';
    }
    return obj.__typename;
  },
};
