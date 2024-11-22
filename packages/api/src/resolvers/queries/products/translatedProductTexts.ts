import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';

export default async function translatedProductTexts(
  root: never,
  { productId }: { productId: string },
  { modules, userId }: Context,
) {
  log(`query translatedProductTexts ${productId}`, { userId });

  return modules.products.texts.findTexts({ productId });
}
