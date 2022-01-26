import { FindOptions, Query } from '@unchainedshop/types/common';
import { FilterAdapterActions } from '@unchainedshop/types/filters';

export const productFulltextSearch = (
  params: {
    filterSelector: Query;
    productSelector: Query;
    sortStage: FindOptions['sort'];
  },
  filterActions: FilterAdapterActions,
) => {
  return async (productIds: Array<string>) => {
    const foundProductIds = await filterActions.searchProducts({ productIds }, params);
    return foundProductIds || [];
  };
};
