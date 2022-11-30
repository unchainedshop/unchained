// import { ProductStatus } from '@unchainedshop/core-products';
import { Query } from '@unchainedshop/types/common';
import { UnchainedCore } from '@unchainedshop/types/core';
import { FilterAdapterActions, SearchQuery } from '@unchainedshop/types/filters';

const defaultSelector = ({ includeInactive }: SearchQuery, { modules }: UnchainedCore) => {
  const selector: Query = !includeInactive
    ? modules.products.search.buildActiveStatusFilter()
    : modules.products.search.buildActiveDraftStatusFilter();
  return selector;
};

export const resolveProductSelector = async (
  searchQuery: SearchQuery,
  filterActions: FilterAdapterActions,
  unchainedAPI: UnchainedCore,
) => {
  const selector = defaultSelector(searchQuery, unchainedAPI);
  return filterActions.transformProductSelector(selector, {});
};
