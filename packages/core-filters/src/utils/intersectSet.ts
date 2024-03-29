export const intersectSet = (productIdSet: Set<string>, filterProductIdSet: Set<string>) =>
  new Set([...productIdSet].filter((currentProductId) => filterProductIdSet.has(currentProductId)));
