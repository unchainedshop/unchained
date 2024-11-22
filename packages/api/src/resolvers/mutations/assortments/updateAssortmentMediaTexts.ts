import { AssortmentMediaText } from '@unchainedshop/core-assortments';
import { log } from '@unchainedshop/logger';
import { AssortmentMediaNotFoundError, InvalidIdError } from '../../../errors.js';
import { Context } from '../../../context.js';

export default async function updateAssortmentMediaTexts(
  root: never,
  { texts, assortmentMediaId }: { texts: Array<AssortmentMediaText>; assortmentMediaId: string },
  { modules, userId }: Context,
) {
  log(`mutation updateAssortmentMediaTexts ${assortmentMediaId}`, {
    userId,
  });

  if (!assortmentMediaId) throw new InvalidIdError({ assortmentMediaId });

  const assortmentMedia = await modules.assortments.media.findAssortmentMedia({
    assortmentMediaId,
  });

  if (!assortmentMedia) throw new AssortmentMediaNotFoundError({ assortmentMediaId });

  return modules.assortments.media.texts.updateMediaTexts(assortmentMediaId, texts);
}
