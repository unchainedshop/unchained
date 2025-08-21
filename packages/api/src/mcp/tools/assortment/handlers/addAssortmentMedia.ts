import { Context } from '../../../../context.js';
import { AssortmentNotFoundError } from '../../../../errors.js';
import { getNormalizedAssortmentDetails } from '../../../utils/getNormalizedAssortmentDetails.js';
import { Params } from '../schemas.js';

export default async function addAssortmentMedia(context: Context, params: Params<'ADD_MEDIA'>) {
  const { modules } = context;
  const { assortmentId, mediaId, tags } = params;

  const assortment = await modules.assortments.findAssortment({ assortmentId });
  if (!assortment) throw new AssortmentNotFoundError({ assortmentId });

  await modules.assortments.media.create({
    assortmentId,
    mediaId,
    tags,
  } as any);

  return { assortment: await getNormalizedAssortmentDetails({ assortmentId }, context) };
}
