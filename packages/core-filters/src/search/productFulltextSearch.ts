import { mongodb } from '@unchainedshop/mongodb';
import { Filter } from '../db/FiltersCollection.js';

export const productFulltextSearch = <Product = unknown>(
  params: {
    filterSelector: mongodb.Filter<Filter>;
    productSelector: mongodb.Filter<Product>;
    sortStage: mongodb.FindOptions['sort'];
  },
  filterActions: {
    searchProducts: (
      searchParams: {
        productIds: Array<string>;
      },
      options?: {
        filterSelector: mongodb.Filter<Filter>;
        productSelector: mongodb.Filter<Product>;
        sortStage: mongodb.FindOptions['sort'];
      },
    ) => Promise<Array<string>>;
  },
) => {
  return async (productIds: Array<string>) => {
    const foundProductIds = await filterActions.searchProducts({ productIds }, params);
    return foundProductIds || [];
  };
};
