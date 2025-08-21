import { Context } from '../../context.js';
import { getNormalizedFilterDetails } from './getNormalizedFilterDetails.js';
import { getNormalizedProductDetails } from './getNormalizedProductDetails.js';
import normalizeMediaUrl from './normalizeMediaUrl.js';

export async function getNormalizedAssortmentDetails(
  { assortmentId, slug }: { assortmentId?: string; slug?: string },
  context: Context,
) {
  const { modules, locale, loaders } = context;
  const assortment = await modules.assortments.findAssortment({ assortmentId, slug });
  const normalizedAssortmentId = assortmentId || assortment._id;
  if (!assortment) return null;

  const texts = await loaders.assortmentTextLoader.load({
    assortmentId: normalizedAssortmentId,
    locale,
  });

  const assortmentFilters = await modules.assortments.filters.findFilters(
    { assortmentId: assortment._id },
    { sort: { sortKey: 1 } },
  );
  const filters_normalized = await Promise.all(
    assortmentFilters?.map(async ({ filterId, ...rest }) => ({
      ...(await getNormalizedFilterDetails(filterId, context)),
      ...rest,
    })) || [],
  );

  const assortmentMedias = await modules.assortments.media.findAssortmentMedias({
    assortmentId: normalizedAssortmentId,
  });
  const assortmentChildLinks = await loaders.assortmentLinksLoader.load({
    parentAssortmentId: assortment._id,
  });

  const assortmentLinks = await loaders.assortmentLinksLoader.load({
    assortmentId: assortment._id,
  });
  const links = await Promise.all(
    assortmentLinks
      .filter((a) => a.childAssortmentId !== assortment._id)
      ?.map(async (link) => ({
        ...(await getNormalizedAssortmentDetails({ assortmentId: link?.childAssortmentId }, context)),
        ...link,
      })) || [],
  );
  const assortmentProducts = await modules.assortments.products.findAssortmentProducts(
    { assortmentId: assortment._id },
    { sort: { sortKey: 1 } },
  );

  const products = await Promise.all(
    assortmentProducts?.map(async ({ productId, ...rest }) => ({
      ...(await getNormalizedProductDetails(productId, context)),
      ...rest,
    })) || [],
  );
  const assortmentIds = assortmentChildLinks.map(({ childAssortmentId }) => childAssortmentId);

  const childrenCount = await modules.assortments.count({
    assortmentIds,
    includeInactive: true,
    includeLeaves: true,
  });
  const media = await normalizeMediaUrl(assortmentMedias, context);

  return {
    ...assortment,
    texts,
    media,
    childrenCount,
    filters: filters_normalized,
    links,
    products,
  };
}
