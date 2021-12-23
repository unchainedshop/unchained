import { Context, Root } from '@unchainedshop/types/api';
import { log } from 'meteor/unchained:logger';

export default async function translatedProductTexts(
  root: Root,
  { productId }: { productId: string },
  { modules, userId }: Context
) {
  log(`query translatedProductTexts ${productId}`, { userId });

  return await modules.products.texts.findTexts({ productId });
}
