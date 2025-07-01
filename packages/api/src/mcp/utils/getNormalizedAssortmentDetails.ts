import { Context } from '../../context.js';
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

  const assortmentMedias = await modules.assortments.media.findAssortmentMedias({
    assortmentId: normalizedAssortmentId,
  });
  const media = await normalizeMediaUrl(assortmentMedias, context);

  return {
    ...assortment,
    texts,
    media,
  };
}
