import facetedSearch from './faceted-search';
import fulltextSearch from './fulltext-search';
import resolveProductSelector from './resolve-product-selector';
import resolveFilterSelector from './resolve-filter-selector';
import resolveSortStage from './resolve-sort-stage';
import parseQueryArray from './parse-query-array';

const cleanQuery = ({ filterQuery, productIds = [], ...query }) => ({
  filterQuery: parseQueryArray(filterQuery),
  productIds: Promise.resolve(productIds),
  ...query
});

const search = async rawQuery => {
  const query = cleanQuery(rawQuery);
  const filterSelector = resolveFilterSelector(query);
  const productSelector = resolveProductSelector(query);
  const sortStage = resolveSortStage(query);

  const { productIds } = query;
  const searchConfiguration = {
    query,
    filterSelector,
    productSelector,
    sortStage
  };

  const totalProductIds = fulltextSearch(searchConfiguration)(productIds);
  const filteredProductIds = totalProductIds.then(
    facetedSearch(searchConfiguration)
  );

  return {
    totalProductIds,
    filteredProductIds,
    ...searchConfiguration
  };
};

export default search;

export { facetedSearch, fulltextSearch, search };
