import { mongodb } from '@unchainedshop/mongodb';
import { SearchQuery } from './search.js';
import { Filter } from '../db/FiltersCollection.js';

const defaultSelector = (searchQuery: SearchQuery) => {
  const { filterIds, filterQuery, includeInactive } = searchQuery;
  const selector: mongodb.Filter<Filter> = {};
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
  filterActions: {
    transformFilterSelector: (
      query: mongodb.Filter<Filter>,
      options?: any,
    ) => Promise<mongodb.Filter<Filter>>;
  },
) => {
  const selector = defaultSelector(searchQuery);
  return filterActions.transformFilterSelector(selector);
};
