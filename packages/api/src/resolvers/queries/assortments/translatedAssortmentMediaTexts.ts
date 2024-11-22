import { log } from '@unchainedshop/logger';
import { Context } from '../../../context.js';

export default async function translatedAssortmentMediaTexts(
  root: never,
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
