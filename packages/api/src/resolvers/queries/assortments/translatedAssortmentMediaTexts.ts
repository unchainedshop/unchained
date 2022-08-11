import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api';

export default async function translatedAssortmentMediaTexts(
  root: Root,
  { assortmentMediaId },
  { modules, userId }: Context,
) {
  log(`query translatedAssortmentMediaTexts ${assortmentMediaId}`, {
    userId,
  });

  return modules.assortments.media.texts.findMediaTexts({
    assortmentMediaId,
  });
}
