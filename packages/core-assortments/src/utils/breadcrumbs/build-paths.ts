const walkAssortmentLinks = (resolveAssortmentLink) => async (rootAssortmentId) => {
  const walk = async (assortmentId, initialPaths: string[], childAssortmentId?: string) => {
    const assortmentLink = await resolveAssortmentLink(assortmentId, childAssortmentId);
    if (!assortmentLink) return initialPaths;

    const subAsssortmentLinks = await Promise.all(
      assortmentLink.parentIds.map(async (parentAssortmentId) => {
        return walk(parentAssortmentId, initialPaths, assortmentId);
      }),
    );

    if (subAsssortmentLinks.length > 0) {
      return subAsssortmentLinks
        .map((subAsssortmentLink) => {
          return subAsssortmentLink.map((subSubLinks) => [
            ...subSubLinks,
            assortmentLink,
            ...initialPaths,
          ]);
        })
        .flat();
    }
    return [[assortmentLink, ...initialPaths]];
  };
  // Recursively walk up the directed graph in reverse
  return walk(rootAssortmentId, []);
};

export const walkUpFromProduct = async ({
  resolveAssortmentProducts,
  resolveAssortmentLink,
  productId,
}) => {
  const pathResolver = walkAssortmentLinks(resolveAssortmentLink);
  const assortmentProducts = await resolveAssortmentProducts(productId);
  return (
    await Promise.all(
      assortmentProducts.map(async (assortmentProduct) => {
        // Walk up the assortments to find all distinct paths
        const paths = await pathResolver(assortmentProduct.assortmentId);
        return paths.map((links) => ({
          ...assortmentProduct,
          links,
        }));
      }),
    )
  ).flat();
};

export const walkUpFromAssortment = async ({ resolveAssortmentLink, assortmentId }) => {
  const pathResolver = walkAssortmentLinks(resolveAssortmentLink);
  const paths = await pathResolver(assortmentId);
  return paths
    .map((links) => ({
      links: links.slice(0, -1),
    }))
    .filter(({ links }) => links.length);
};
