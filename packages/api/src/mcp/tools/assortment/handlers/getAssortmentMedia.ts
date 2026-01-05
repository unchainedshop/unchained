import type { Context } from '../../../../context.ts';
import { AssortmentNotFoundError } from '../../../../errors.ts';
import { getNormalizedAssortmentDetails } from '../../../utils/getNormalizedAssortmentDetails.ts';
import normalizeMediaUrl from '../../../utils/normalizeMediaUrl.ts';
import type { Params } from '../schemas.ts';

export default async function getAssortmentMedia(context: Context, params: Params<'GET_MEDIA'>) {
  const { modules } = context;
  const { assortmentId, tags, limit = 50, offset = 0 } = params;

  const assortment = await getNormalizedAssortmentDetails({ assortmentId }, context);
  if (!assortment) throw new AssortmentNotFoundError({ assortmentId });

  // Always use the module method for proper DB-level pagination
  const media = await modules.assortments.media.findAssortmentMedias({
    assortmentId,
    limit,
    offset,
    tags,
  });
  const media_normalized = await normalizeMediaUrl(media, context);
  return { assortment, media: media_normalized };
}
