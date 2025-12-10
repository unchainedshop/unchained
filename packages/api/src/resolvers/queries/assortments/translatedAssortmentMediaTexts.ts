import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';

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
