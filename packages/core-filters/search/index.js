import facetedSearch from './faceted-search';
import fulltextSearch from './fulltext-search';
import resolveProductSelector from './resolve-product-selector';
import resolveAssortmentSelector from './resolve-assortment-selector';
import resolveFilterSelector from './resolve-filter-selector';
import resolveSortStage from './resolve-sort-stage';
import parseQueryArray from './parse-query-array';

const cleanQuery = ({ filterQuery, productIds = null, ...query }) => ({
  filterQuery: parseQueryArray(filterQuery),
  productIds: Promise.resolve(productIds),
  ...query,
});

const search = async ({ query: rawQuery, forceLiveCollection, context }) => {
  const query = cleanQuery(rawQuery);
  const filterSelector = resolveFilterSelector(query);
  const productSelector = resolveProductSelector(query);
  const assortmentSelector = resolveAssortmentSelector(query);
  const sortStage = resolveSortStage(query);

  const searchConfiguration = {
    query,
    filterSelector,
    productSelector,
    assortmentSelector,
    sortStage,
    context,
    forceLiveCollection,
  };

  if (rawQuery?.productIds?.length === 0) {
    // Restricted to an empty array of products
    // will always lead to an empty result
    return {
      totalProductIds: [],
      filteredProductIds: [],
      filteredAssortmentIds: [],
      ...searchConfiguration,
    };
  }

  const totalProductIds = fulltextSearch(searchConfiguration)(
    query?.productIds,
  );
  const filteredProductIds = totalProductIds.then(
    facetedSearch(searchConfiguration),
  );
  
  const totalAssortmentIds = fulltextSearch(searchConfiguration)(
    query?.assortmentIds,
  );
  const filteredAssortmentIds = totalAssortmentIds.then(
    facetedSearch(searchConfiguration),
  );

  return {
    totalProductIds,
    totalAssortmentIds,
    filteredProductIds,
    filteredAssortmentIds,
    ...searchConfiguration,
  };
};

export default search;

export { facetedSearch, fulltextSearch, search };
