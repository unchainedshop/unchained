import { Query } from '@unchainedshop/types/common.js';
import { FilterAdapterActions } from '@unchainedshop/types/filters.js';
import { mongodb } from '@unchainedshop/mongodb';

export const productFulltextSearch = (
  params: {
    filterSelector: Query;
    productSelector: Query;
    sortStage: mongodb.FindOptions['sort'];
  },
  filterActions: FilterAdapterActions,
) => {
  return async (productIds: Array<string>) => {
    const foundProductIds = await filterActions.searchProducts({ productIds }, params);
    return foundProductIds || [];
  };
};
