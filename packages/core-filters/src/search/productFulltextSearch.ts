import { mongodb } from '@unchainedshop/mongodb';
import type { Product } from '@unchainedshop/core-products';
import { Filter, FilterAdapterActions } from '../types.js';

export const productFulltextSearch = (
  params: {
    filterSelector: mongodb.Filter<Filter>;
    productSelector: mongodb.Filter<Product>;
    sortStage: mongodb.FindOptions['sort'];
  },
  filterActions: FilterAdapterActions,
) => {
  return async (productIds: Array<string>) => {
    const foundProductIds = await filterActions.searchProducts({ productIds }, params);
    return foundProductIds || [];
  };
};
