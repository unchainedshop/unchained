import { Products, ProductStatus } from 'meteor/unchained:core-products';
import { Filters } from '../db/collections';
import { findPreservingIds } from 'meteor/unchained:utils';

export default async ({ filterIds, productIds, filterQuery, forceLiveCollection, includeInactive, orderBy }) => {
  const selector = {
    status: { $in: [ProductStatus.ACTIVE, ProductStatus.DRAFT] }
  };
  if (!includeInactive) {
    selector.status = ProductStatus.ACTIVE;
  }

  const filteredProductIds = Filters.filterProductIds({
    productIds,
    query: filterQuery,
    forceLiveCollection
  });

  return {
    totalProducts: async () =>
      Products.find({
        ...selector,
        _id: { $in: productIds }
      }).count(),
    filteredProducts: async () =>
      Products.find({
        ...selector,
        _id: { $in: filteredProductIds }
      }).count(),
    products: async ({ offset, limit, sort = {} }) => findPreservingIds(Products)(
      selector,
      filteredProductIds,
      { skip: offset, limit, sort }
    ),
    filters: async () => Filters.filterFilters({
      filterIds,
      productIds,
      query: filterQuery,
      forceLiveCollection,
      includeInactive
    })
  };
}
