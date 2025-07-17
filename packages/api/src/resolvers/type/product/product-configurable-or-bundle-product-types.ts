import { Product as ProductType } from '@unchainedshop/core-products';
import { ProductTypes } from '@unchainedshop/core-products';
import { objectInvert } from '@unchainedshop/utils';

export const ConfigurableOrBundleProduct = {
  __resolveType: (product: ProductType): string => {
    const invertedProductTypes = objectInvert(ProductTypes);
    return invertedProductTypes[product.type];
  },
};
