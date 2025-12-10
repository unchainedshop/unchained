import type { AssortmentMediaText } from '@unchainedshop/core-assortments';
import type { Context } from '../../../../context.ts';
import { AssortmentMediaNotFoundError } from '../../../../errors.ts';
import type { Params } from '../schemas.ts';

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
    mediaTexts as AssortmentMediaText[],
  );
  return { texts: texts_updated };
}
