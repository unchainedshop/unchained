export default (productIdSet, filterProductIdSet) =>
  [...productIdSet].filter((currentProductId) =>
    filterProductIdSet.has(currentProductId)
  );
