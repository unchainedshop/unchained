import facetedSearch from './faceted-search';
import fulltextSearch from './fulltext-search';
import resolveProductSelector from './resolve-product-selector';
import resolveAssortmentSelector from './resolve-assortment-selector';
import resolveFilterSelector from './resolve-filter-selector';
import resolveSortStage from './resolve-sort-stage';
import parseQueryArray from './parse-query-array';

const cleanQuery = ({
  filterQuery,
  assortmentIds = null,
  productIds = null,
  ...query
}) => ({
  filterQuery: parseQueryArray(filterQuery),
  productIds: Promise.resolve(productIds),
  assortmentIds: Promise.resolve(assortmentIds),
  ...query,
});

const searchProducts = async ({
  query: rawQuery,
  forceLiveCollection,
  context,
}) => {
  const query = cleanQuery(rawQuery);
  const filterSelector = resolveFilterSelector(query);
  const productSelector = resolveProductSelector(query);
  const sortStage = resolveSortStage(query);

  const searchConfiguration = {
    query,
    filterSelector,
    productSelector,
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
      ...searchConfiguration,
    };
  }
  const totalProductIds = fulltextSearch(searchConfiguration)(
    query?.productIds
  );

  const filteredProductIds = totalProductIds.then(
    facetedSearch(searchConfiguration)
  );

  return {
    totalProductIds,
    filteredProductIds,
    ...searchConfiguration,
  };
};

const searchAssortments = async ({
  query: rawQuery,
  forceLiveCollection,
  context,
}) => {
  const query = cleanQuery(rawQuery);
  const filterSelector = resolveFilterSelector(query);
  const assortmentSelector = resolveAssortmentSelector(query);
  const sortStage = resolveSortStage(query);

  const searchConfiguration = {
    query,
    filterSelector,
    assortmentSelector,
    sortStage,
    context,
    forceLiveCollection,
  };

  const totalAssortmentIds = fulltextSearch(searchConfiguration)(
    query?.assortmentIds
  );

  return {
    totalAssortmentIds,
    ...searchConfiguration,
  };
};

export default searchProducts;

export { facetedSearch, fulltextSearch, searchProducts, searchAssortments };
