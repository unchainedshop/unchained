import { Filter, FilterAdapterActions } from '@unchainedshop/types/filters.js';
import { mongodb } from '@unchainedshop/mongodb';
import { Product } from '@unchainedshop/types/products.js';

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
