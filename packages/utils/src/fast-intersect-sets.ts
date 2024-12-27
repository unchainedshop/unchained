export default (productIdSet: Set<string>, filterProductIdSet: Set<string>) => {
  return [...productIdSet].filter((currentProductId) => filterProductIdSet.has(currentProductId));
};
