import { Context } from '../../../../context.js';
import { AssortmentNotFoundError } from '../../../../errors.js';
import normalizeMediaUrl from '../../../utils/normalizeMediaUrl.js';
import { Params } from '../schemas.js';

export default async function addAssortmentMedia(context: Context, params: Params<'ADD_MEDIA'>) {
  const { modules } = context;
  const { assortmentId, mediaId, tags } = params;

  const assortment = await modules.assortments.findAssortment({ assortmentId });
  if (!assortment) throw new AssortmentNotFoundError({ assortmentId });

  const assortmentMedia = await modules.assortments.media.create({
    assortmentId,
    mediaId,
    tags,
  } as any);

  return { media: await normalizeMediaUrl([assortmentMedia], context) };
}
