import { Products } from 'meteor/unchained:core-products';
import { Filters } from 'meteor/unchained:core-filters';

import { findPreservingIds } from 'meteor/unchained:utils';

export default {
  totalProducts: async ({ productSelector, totalProductIds }) =>
    Products.find({
      ...productSelector,
      _id: { $in: await totalProductIds }
    }).count(),
  filteredProducts: async ({ productSelector, filteredProductIds }) =>
    Products.find({
      ...productSelector,
      _id: { $in: await filteredProductIds }
    }).count(),
  products: async (
    { productSelector, filteredProductIds },
    { offset, limit, sort = {} }
  ) =>
    findPreservingIds(Products)(productSelector, await filteredProductIds, {
      skip: offset,
      limit,
      sort
    }),
  filters: async ({ filterSelector, totalProductIds, query }) => {
    const otherFilters = Filters.find(filterSelector).fetch();
    const allProductIdsSet = new Set(await totalProductIds);

    return otherFilters.map(filter => {
      return filter.load({
        ...query,
        allProductIdsSet,
        otherFilters
      });
    });
  }
};
