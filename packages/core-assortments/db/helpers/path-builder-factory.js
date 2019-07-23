const pathBuilderFactory = fetcher => rootAssortmentId => {
  const walk = (assortmentId, initialPaths = [], childAssortmentId) => {
    const assortmentLink = fetcher(assortmentId, childAssortmentId);
    if (!assortmentLink) return initialPaths;
    return [
      ...assortmentLink.parents.flatMap(parentAssortmentId => {
        return walk(parentAssortmentId, initialPaths, assortmentId);
      }),
      ...[assortmentLink],
      ...initialPaths
    ];
  };
  const result = walk(rootAssortmentId, []);
  return result;
};

export default pathBuilderFactory;
