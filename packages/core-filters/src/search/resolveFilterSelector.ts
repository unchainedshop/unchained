import { Query } from '@unchainedshop/types/common.js';
import { FilterAdapterActions, SearchQuery } from '@unchainedshop/types/filters.js';

const defaultSelector = (searchQuery: SearchQuery) => {
  const { filterIds, filterQuery, includeInactive } = searchQuery;
  const selector: Query = {};
  const keys = (filterQuery || []).map((filter) => filter.key);

  if (filterIds) {
    // return explicit list because filters are preset by search
    selector._id = { $in: filterIds };
  } else if (keys.length > 0) {
    // return filters that are part of the filterQuery
    selector.key = { $in: keys };
  }

  if (!includeInactive) {
    // include only active filters
    selector.isActive = true;
  }

  return selector;
};

export const resolveFilterSelector = async (
  searchQuery: SearchQuery,
  filterActions: FilterAdapterActions,
) => {
  const selector = defaultSelector(searchQuery);
  return filterActions.transformFilterSelector(selector);
};
