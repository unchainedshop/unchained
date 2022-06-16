import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api';

export default async function translatedAssortmentMediaTexts(
  root: Root,
  { assortmentMediaId },
  { modules, userId }: Context,
) {
  log(`query translatedAssortmentMediaTexts ${assortmentMediaId}`, {
    modules,
    userId,
  });

  return modules.assortments.media.texts.findMediaTexts({
    assortmentMediaId,
  });
}
