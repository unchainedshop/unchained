import facetedSearch from './faceted-search';
import fulltextSearch from './fulltext-search';
import resolveProductSelector from './resolve-product-selector';
import resolveFilterSelector from './resolve-filter-selector';
import parseQueryArray from './parse-query-array';

const cleanQuery = ({ filterQuery, productIds = [], ...query }) => ({
  filterQuery: parseQueryArray(filterQuery),
  productIds: Promise.resolve(productIds),
  ...query
});

const search = async rawQuery => {
  const query = cleanQuery(rawQuery);
  const { productIds } = query;

  const productSelector = resolveProductSelector(query);
  const filterSelector = resolveFilterSelector(query);

  const totalProductIds = fulltextSearch(query)(productIds);
  const filteredProductIds = facetedSearch(query)(totalProductIds);

  return {
    totalProductIds,
    filteredProductIds,
    productSelector,
    filterSelector,
    query
  };
};

export default search;

export { facetedSearch, fulltextSearch, search };
