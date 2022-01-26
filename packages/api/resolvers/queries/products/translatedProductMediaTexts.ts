import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';

export default async function translatedProductMediaTexts(
  root: Root,
  { productMediaId }: { productMediaId: string },
  { modules, userId }: Context,
) {
  log(`query translatedProductMediaTexts ${productMediaId}`, { userId });

  return modules.products.media.texts.findMediaTexts({ productMediaId });
}
