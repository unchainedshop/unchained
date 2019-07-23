const pathBuilderFactory = fetcher => async rootAssortmentId => {
  const walk = async (assortmentId, initialPaths = [], childAssortmentId) => {
    const assortmentLink = await fetcher(assortmentId, childAssortmentId);
    if (!assortmentLink) return initialPaths;
    const subAsssortmentLinks = await Promise.all(
      assortmentLink.parentIds.map(async parentAssortmentId => {
        return walk(parentAssortmentId, initialPaths, assortmentId);
      })
    );

    if (subAsssortmentLinks.length > 0) {
      return subAsssortmentLinks.map(subAsssortmentLink => {
        return [
          ...subAsssortmentLink.flat(),
          ...[assortmentLink],
          ...initialPaths
        ];
      });
    }
    return [[...[assortmentLink], ...initialPaths]];
  };
  return walk(rootAssortmentId, []);
};

export default pathBuilderFactory;
