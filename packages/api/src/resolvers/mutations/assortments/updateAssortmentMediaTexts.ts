import type { AssortmentMediaText } from '@unchainedshop/core-assortments';
import { log } from '@unchainedshop/logger';
import { AssortmentMediaNotFoundError, InvalidIdError } from '../../../errors.ts';
import type { Context } from '../../../context.ts';

export default async function updateAssortmentMediaTexts(
  root: never,
  { texts, assortmentMediaId }: { texts: AssortmentMediaText[]; assortmentMediaId: string },
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
