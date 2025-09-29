import { Context } from '../../context.js';
import normalizeMediaUrl from './normalizeMediaUrl.js';

export async function getNormalizedAssortmentDetails(
  { assortmentId, slug }: { assortmentId?: string; slug?: string },
  context: Context,
) {
  const { modules, locale, loaders } = context;
  const assortment = await modules.assortments.findAssortment({ assortmentId, slug });
  const normalizedAssortmentId = assortmentId || assortment!._id;
  if (!assortment) return null;

  const texts = await loaders.assortmentTextLoader.load({
    assortmentId: normalizedAssortmentId,
    locale,
  });

  const filters = await modules.assortments.filters.findFilters(
    { assortmentId: assortment._id },
    { sort: { sortKey: 1 } },
  );

  const assortmentMedias = await modules.assortments.media.findAssortmentMedias({
    assortmentId: normalizedAssortmentId,
  });
  const assortmentChildLinks = await loaders.assortmentLinksLoader.load({
    parentAssortmentId: assortment._id,
  });

  const links =
    (await loaders.assortmentLinksLoader.load({
      assortmentId: assortment._id,
    })) || [];

  const products = await modules.assortments.products.findAssortmentProducts(
    { assortmentId: assortment._id },
    { sort: { sortKey: 1 } },
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
    texts: {
      ...texts,
      description: null,
    },
    media,
    childrenCount,
    filters,
    links,
    products,
  };
}
