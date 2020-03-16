import { FilterDirector } from 'meteor/unchained:core-filters';

const defaultSelector = ({ filterIds, filterQuery = {}, includeInactive }) => {
  const selector = {};
  const keys = Object.keys(filterQuery);
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

export default async query => {
  const selector = defaultSelector(query);
  const director = new FilterDirector({ query });
  return director.buildFilterSelector(selector);
};
