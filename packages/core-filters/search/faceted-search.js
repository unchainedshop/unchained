import { Filters } from '../db/collections';
import intersectProductIds from './intersect-product-ids';

export default ({ query, filterSelector }) => async productIdResolver => {
  const { filterQuery, forceLiveCollection } = query;
  if (!filterQuery || filterQuery.length === 0) return productIdResolver;

  const [selector, allProductIds] = await Promise.all([
    filterSelector,
    productIdResolver
  ]);
  const filters = selector ? Filters.find(selector).fetch() : [];
  const intersectedProductIds = intersectProductIds({
    productIds: allProductIds,
    filters,
    filterQuery,
    forceLiveCollection
  });

  return [...intersectedProductIds];
};
