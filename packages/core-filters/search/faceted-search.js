import { Filters } from '../db/collections';
import intersectProductIds from './intersect-product-ids';
import resolveFilterSelector from './resolve-filter-selector';

export default query => async productIdResolver => {
  const { filterQuery, forceLiveCollection } = query;
  if (!filterQuery || filterQuery.length === 0) return productIdResolver;

  const selector = resolveFilterSelector(query);
  const filters = Filters.find(selector).fetch();

  const allProductIds = await productIdResolver;
  const intersectedProductIds = intersectProductIds({
    productIds: allProductIds,
    filters,
    filterQuery,
    forceLiveCollection
  });

  return [...intersectedProductIds];
};
