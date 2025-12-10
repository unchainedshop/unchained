import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';

export default async function translatedProductMediaTexts(
  root: never,
  { productMediaId }: { productMediaId: string },
  { modules, userId }: Context,
) {
  log(`query translatedProductMediaTexts ${productMediaId}`, { userId });

  return modules.products.media.texts.findMediaTexts({ productMediaId });
}
