import {
  type BreadcrumbAssortmentProductFunction,
  type BreadcrumbAssortmentLinkFunction,
} from '../../assortments-index.ts';

const walkAssortmentLinks =
  (resolveAssortmentLinks: BreadcrumbAssortmentLinkFunction) => async (rootAssortmentId) => {
    const walk = async (assortmentId) => {
      const parentAssortmentLinks = await resolveAssortmentLinks(assortmentId);
      if (!parentAssortmentLinks?.length)
        return [
          [
            {
              childAssortmentId: assortmentId,
              parentAssortmentId: null,
            },
          ],
        ];

      return await Promise.all(
        parentAssortmentLinks.map(async (assortmentLink) => {
          const upstream = await walk(assortmentLink.parentAssortmentId);
          if (upstream.length) {
            return [...upstream, assortmentLink].flat();
          }
          return [assortmentLink];
        }),
      );
    };
    // Recursively walk up the directed graph in reverse
    return walk(rootAssortmentId);
  };

export const walkUpFromProduct = async ({
  resolveAssortmentProducts,
  resolveAssortmentLinks,
  productId,
}: {
  resolveAssortmentProducts: BreadcrumbAssortmentProductFunction;
  resolveAssortmentLinks: BreadcrumbAssortmentLinkFunction;
  productId: string;
}) => {
  const pathResolver = walkAssortmentLinks(resolveAssortmentLinks);
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

export const walkUpFromAssortment = async ({ resolveAssortmentLinks, assortmentId }) => {
  const pathResolver = walkAssortmentLinks(resolveAssortmentLinks);
  const paths = await pathResolver(assortmentId);
  return paths.map((links) => ({
    links: links.slice(0, -1),
  }));
};
