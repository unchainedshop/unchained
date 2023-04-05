import { UnchainedCore } from '@unchainedshop/types/core.js';
import { FilterAdapterActions, SearchQuery } from '@unchainedshop/types/filters.js';

const defaultSelector = ({ includeInactive }: SearchQuery, { modules }: UnchainedCore) => {
  const selector = !includeInactive
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
