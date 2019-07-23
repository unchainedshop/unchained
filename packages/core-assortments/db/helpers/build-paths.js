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
        return [...subAsssortmentLink.flat(), assortmentLink, ...initialPaths];
      });
    }
    return [[assortmentLink, ...initialPaths]];
  };
  // Recursively walk up the directed graph in reverse
  return walk(rootAssortmentId, []);
};

export default async ({
  resolveAssortmentLink,
  resolveAssortmentProducts,
  productId
}) => {
  // Get all assortment/product assignments
  const assortmentProducts = await resolveAssortmentProducts(productId);
  return (await Promise.all(
    assortmentProducts.map(async assortmentProduct => {
      // Walk up the assortments to find all distinct paths
      const paths = await walkAssortmentLinks(resolveAssortmentLink)(
        assortmentProduct.assortmentId
      );
      return paths.map(links => ({
        ...assortmentProduct,
        links
      }));
    })
  )).flat();
};
