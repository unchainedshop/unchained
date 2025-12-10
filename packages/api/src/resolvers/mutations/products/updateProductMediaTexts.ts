import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';
import type { ProductMediaText } from '@unchainedshop/core-products';
import { ProductMediaNotFoundError, InvalidIdError } from '../../../errors.ts';

export default async function updateProductMediaTexts(
  root: never,
  { productMediaId, texts }: { productMediaId: string; texts: ProductMediaText[] },
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
