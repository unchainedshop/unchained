export default ({ productIds, filters, filterQuery, ...options }) =>
  filters.reduce((productIdSet, filter) => {
    const values = filterQuery[filter.key];
    return filter.intersect({ values, productIdSet, ...options });
  }, new Set(productIds));
