import { Context, Root } from '@unchainedshop/types/api';
import { AssortmentMediaText } from '@unchainedshop/types/assortments.media';
import { log } from '@unchainedshop/logger';
import { AssortmentMediaNotFoundError, InvalidIdError } from '../../../errors';

export default async function updateAssortmentMediaTexts(
  root: Root,
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
