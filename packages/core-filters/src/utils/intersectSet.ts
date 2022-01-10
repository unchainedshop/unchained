export const intersectSet = (
  productIdSet: Set<String>,
  filterProductIdSet: Set<String>
) =>
  new Set(
    [...productIdSet].filter((currentProductId) =>
      filterProductIdSet.has(currentProductId)
    )
  );
