const walkAssortmentLinks = fetcher => async rootAssortmentId => {
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

export default async ({
  resolveAssortmentLink,
  resolveAssortmentProducts,
  productId
}) => {
  const assortmentProducts = await resolveAssortmentProducts(productId);
  return (await Promise.all(
    assortmentProducts.map(async ({ _id, assortmentId }) => {
      const paths = await walkAssortmentLinks(resolveAssortmentLink)(
        assortmentId
      );
      return paths.map(links => ({
        _id,
        links
      }));
    })
  )).flat();
};
