import { FilterDirector } from 'meteor/unchained:core-filters';
import { Filters } from '../db/collections';

export default ({ query, filterSelector, ...rest }) => {
  const { filterQuery, forceLiveCollection } = query;
  const director = new FilterDirector({
    query,
    ...rest,
  });

  return async (productIdResolver) => {
    if (!filterQuery || filterQuery.length === 0) return productIdResolver;

    const [selector, allProductIds] = await Promise.all([
      filterSelector,
      productIdResolver,
    ]);
    const filters = selector ? Filters.find(selector).fetch() : [];

    const intersectedProductIds = filters.reduce((productIdSet, filter) => {
      if (!filterQuery[filter.key]) return productIdSet;
      const filterOptionProductIds = filter.productIds({
        values: filterQuery[filter.key],
        forceLiveCollection,
      });

      return director.intersect(productIdSet, new Set(filterOptionProductIds));
    }, new Set(allProductIds));

    return [...intersectedProductIds];
  };
};
