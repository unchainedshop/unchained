import { Query } from '@unchainedshop/types/common';
import { FilterAdapterActions, SearchQuery } from '@unchainedshop/types/filters';

const defaultSelector = ({ filterIds, filterQuery, includeInactive }: SearchQuery) => {
  const selector: Query = {};
  const keys = (filterQuery || []).map((filter) => filter.key);
  if (Array.isArray(filterIds)) {
    // return predefined list
    selector._id = { $in: filterIds };
  } else if (keys.length > 0) {
    // return filters that are part of the filterQuery
    selector.key = { $in: keys };
  } else {
    // do not return filters
    return null;
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
