import { Products } from 'meteor/unchained:core-products';
import { Filters } from 'meteor/unchained:core-filters';

import { findPreservingIds } from 'meteor/unchained:utils';

export default {
  totalProducts: async ({ productSelector, totalProductIds }) =>
    Products.find({
      ...(await productSelector),
      _id: { $in: await totalProductIds }
    }).count(),
  filteredProducts: async ({ productSelector, filteredProductIds }) =>
    Products.find({
      ...(await productSelector),
      _id: { $in: await filteredProductIds }
    }).count(),
  products: async (
    { productSelector, filteredProductIds, sortStage },
    { offset, limit }
  ) =>
    findPreservingIds(Products)(
      await productSelector,
      await filteredProductIds,
      {
        skip: offset,
        limit,
        sort: await sortStage
      }
    ),
  filters: async ({
    filterSelector,
    productSelector,
    totalProductIds,
    query
  }) => {
    const otherFilters = Filters.find(await filterSelector).fetch();

    const relevantProductIds = Products.find(
      {
        ...(await productSelector),
        _id: { $in: await totalProductIds }
      },
      {
        fields: { _id: 1 }
      }
    ).map(({ _id }) => _id);

    return otherFilters.map(filter => {
      return filter.load({
        ...query,
        allProductIdsSet: new Set(relevantProductIds),
        otherFilters
      });
    });
  }
};
