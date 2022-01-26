import { FilterDirector } from 'meteor/unchained:core-filters';
import { Filters } from '../db/collections';
import intersectSet from '../intersect-set';

export default ({ query, filterSelector, ...options }) => {
  const { filterQuery, forceLiveCollection } = query;
  return async (productIdResolver) => {
    if (!filterQuery || filterQuery.length === 0) return productIdResolver;

    const [selector, allProductIds] = await Promise.all([filterSelector, productIdResolver]);
    const filters = selector ? Filters.find(selector).fetch() : [];

    const intersectedProductIds = filters.reduce((productIdSet, filter) => {
      if (!filterQuery[filter.key]) return productIdSet;
      const filterOptionProductIds = filter.productIds({
        values: filterQuery[filter.key],
        forceLiveCollection,
      });

      return intersectSet(productIdSet, new Set(filterOptionProductIds));
    }, new Set(allProductIds));

    return [...intersectedProductIds];
  };
};
