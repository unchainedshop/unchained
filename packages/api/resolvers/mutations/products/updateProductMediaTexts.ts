import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';
import { ProductMediaNotFoundError, InvalidIdError } from '../../../errors';
import { ProductMediaText } from '@unchainedshop/types/products.media';

export default async function updateProductMediaTexts(
  root: Root,
  {
    productMediaId,
    texts,
  }: { productMediaId: string; texts: Array<ProductMediaText> },
  { modules, userId }: Context
) {
  log(`mutation updateProductMediaTexts ${productMediaId}`, { userId });

  if (!productMediaId) throw new InvalidIdError({ productMediaId });

  const productMedia = await modules.products.media.findProductMedia({
    productMediaId,
  });
  if (!productMedia) throw new ProductMediaNotFoundError({ productMediaId });

  return await modules.products.media.texts.updateMediaTexts(
    productMediaId,
    texts,
    userId
  );
}
