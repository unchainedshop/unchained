import { Product as ProductType } from '@unchainedshop/types/products';
import { ProductTypes } from 'meteor/unchained:core-products';
import { objectInvert } from 'meteor/unchained:utils';

export const Product = {
  __resolveType(obj: ProductType) {
    const invertedProductTypes = objectInvert(ProductTypes);
    return invertedProductTypes[obj.type];
  },
};
