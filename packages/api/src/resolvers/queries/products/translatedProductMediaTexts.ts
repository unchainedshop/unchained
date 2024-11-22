import { log } from '@unchainedshop/logger';
import { Context } from '../../../context.js';

export default async function translatedProductMediaTexts(
  root: never,
  { productMediaId }: { productMediaId: string },
  { modules, userId }: Context,
) {
  log(`query translatedProductMediaTexts ${productMediaId}`, { userId });

  return modules.products.media.texts.findMediaTexts({ productMediaId });
}
