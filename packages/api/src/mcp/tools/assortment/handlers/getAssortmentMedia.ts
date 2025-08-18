import { Context } from '../../../../context.js';
import { AssortmentNotFoundError } from '../../../../errors.js';
import { getNormalizedAssortmentDetails } from '../../../utils/getNormalizedAssortmentDetails.js';
import normalizeMediaUrl from '../../../utils/normalizeMediaUrl.js';
import { Params } from '../schemas.js';

export default async function getAssortmentMedia(context: Context, params: Params<'GET_MEDIA'>) {
  const { modules, loaders } = context;
  const { assortmentId, tags, limit = 50, offset = 0 } = params;

  const assortment = await getNormalizedAssortmentDetails({ assortmentId }, context);
  if (!assortment) throw new AssortmentNotFoundError({ assortmentId });

  let media;
  if (offset || tags) {
    media = await modules.assortments.media.findAssortmentMedias({
      assortmentId,
      limit,
      offset,
      tags,
    });
  } else {
    media = (await loaders.assortmentMediasLoader.load({ assortmentId })).slice(offset, offset + limit);
  }
  const media_normalized = await normalizeMediaUrl(media, context);
  return { assortment, media: media_normalized };
}
