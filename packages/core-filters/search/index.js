import { Assortments } from 'meteor/unchained:core-assortments';
import { Products } from 'meteor/unchained:core-products';
import { Filters } from 'meteor/unchained:core-filters';

import { findPreservingIds } from 'meteor/unchained:utils';

import productFacetedSearch from './product-faceted-search';
import productFulltextSearch from './product-fulltext-search';
import assortmentFulltextSearch from './assortment-fulltext-search';
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

  const totalProductIds = productFulltextSearch(searchConfiguration)(
    query?.productIds
  );

  const findFilters = async () => {
    const resolvedFilterSelector = await filterSelector;
    const extractedFilterIds = resolvedFilterSelector?._id?.$in || [];
    const otherFilters = Filters.find(resolvedFilterSelector)
      .fetch()
      .sort((left, right) => {
        const leftIndex = extractedFilterIds.indexOf(left._id);
        const rightIndex = extractedFilterIds.indexOf(right._id);
        return leftIndex - rightIndex;
      });

    const relevantProductIds = Products.find(
      {
        ...(await productSelector),
        _id: { $in: await totalProductIds },
      },
      {
        fields: { _id: 1 },
      }
    ).map(({ _id }) => _id);

    return otherFilters.map((filter) => {
      return filter.load({
        ...query,
        allProductIdsSet: new Set(relevantProductIds),
        otherFilters,
      });
    });
  };

  if (rawQuery?.productIds?.length === 0) {
    // Restricted to an empty array of products
    // will always lead to an empty result
    return {
      totalProducts: 0,
      filteredProducts: 0,
      products: () => [],
      filters: findFilters,
    };
  }

  const filteredProductIds = totalProductIds.then(
    productFacetedSearch(searchConfiguration)
  );

  return {
    totalProducts: async () =>
      Products.find({
        ...(await productSelector),
        _id: { $in: await totalProductIds },
      }).count(),
    filteredProducts: async () =>
      Products.find({
        ...(await productSelector),
        _id: { $in: await filteredProductIds },
      }).count(),
    products: async ({ offset, limit }) =>
      findPreservingIds(Products)(
        await productSelector,
        await filteredProductIds,
        {
          skip: offset,
          limit,
          sort: await sortStage,
        }
      ),
    filters: findFilters,
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

  const totalAssortmentIds = assortmentFulltextSearch(searchConfiguration)(
    query?.productIds
  );

  return {
    totalAssortments: async () =>
      Assortments.find({
        ...(await assortmentSelector),
        _id: { $in: await totalAssortmentIds },
      }).count(),
    assortments: async ({ offset, limit }) =>
      findPreservingIds(Assortments)(
        await assortmentSelector,
        await totalAssortmentIds,
        {
          skip: offset,
          limit,
          sort: await sortStage,
        }
      ),
  };
};

export default searchProducts;

export {
  productFacetedSearch,
  productFulltextSearch,
  assortmentFulltextSearch,
  searchProducts,
  searchAssortments,
};
