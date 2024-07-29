import { log } from '@unchainedshop/logger';
import { Context } from '../../../types.js';
import { ProductMediaText } from '@unchainedshop/core-products';
import { ProductMediaNotFoundError, InvalidIdError } from '../../../errors.js';

export default async function updateProductMediaTexts(
  root: never,
  { productMediaId, texts }: { productMediaId: string; texts: Array<ProductMediaText> },
  { modules, userId }: Context,
) {
  log(`mutation updateProductMediaTexts ${productMediaId}`, { userId });

  if (!productMediaId) throw new InvalidIdError({ productMediaId });

  const productMedia = await modules.products.media.findProductMedia({
    productMediaId,
  });
  if (!productMedia) throw new ProductMediaNotFoundError({ productMediaId });

  return modules.products.media.texts.updateMediaTexts(productMediaId, texts);
}
