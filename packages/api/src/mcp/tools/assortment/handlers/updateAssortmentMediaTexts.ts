import { Context } from '../../../../context.js';
import { AssortmentMediaNotFoundError } from '../../../../errors.js';
import { Params } from '../schemas.js';

export default async function updateAssortmentMediaTexts(
  context: Context,
  params: Params<'UPDATE_MEDIA_TEXTS'>,
) {
  const { modules } = context;
  const { assortmentMediaId, mediaTexts } = params;

  const media = await modules.assortments.media.findAssortmentMedia({ assortmentMediaId });
  if (!media) throw new AssortmentMediaNotFoundError({ assortmentMediaId });

  const texts_updated = await modules.assortments.media.texts.updateMediaTexts(
    assortmentMediaId,
    mediaTexts,
  );
  return { texts: texts_updated };
}
