import { Context } from '../../../../context.js';
import { AssortmentMediaNotFoundError } from '../../../../errors.js';
import { Params } from '../schemas.js';

export default async function getAssortmentMediaTexts(
  context: Context,
  params: Params<'GET_MEDIA_TEXTS'>,
) {
  const { modules } = context;
  const { assortmentMediaId } = params;

  const media = await modules.assortments.media.findAssortmentMedia({ assortmentMediaId });
  if (!media) throw new AssortmentMediaNotFoundError({ assortmentMediaId });

  const texts = await modules.assortments.media.texts.findMediaTexts({ assortmentMediaId });
  return { texts };
}
