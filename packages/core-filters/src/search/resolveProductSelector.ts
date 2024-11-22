import { FilterAdapterActions, SearchQuery } from '../types.js';

const defaultSelector = ({ includeInactive }: SearchQuery, { modules }) => {
  const selector = !includeInactive
    ? modules.products.search.buildActiveStatusFilter()
    : modules.products.search.buildActiveDraftStatusFilter();
  return selector;
};

export const resolveProductSelector = async (
  searchQuery: SearchQuery,
  filterActions: FilterAdapterActions,
  unchainedAPI,
) => {
  const selector = defaultSelector(searchQuery, unchainedAPI);
  return filterActions.transformProductSelector(selector, {});
};
