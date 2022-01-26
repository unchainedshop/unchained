import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';
import { ProductVariationText } from '@unchainedshop/types/products.variations';
import { ProductVariationNotFoundError, InvalidIdError } from '../../../errors';

export default async function F(
  root: Root,
  params: {
    productVariationId: string;
    productVariationOptionValue?: string;
    texts: Array<ProductVariationText>;
  },
  { modules, userId }: Context,
) {
  const { productVariationId, productVariationOptionValue, texts } = params;

  log(`mutation updateProductVariationTexts ${productVariationId}`, { userId });

  if (!productVariationId) throw new InvalidIdError({ productVariationId });

  const productVariation = await modules.products.variations.findProductVariation({
    productVariationId,
  });
  if (!productVariation) throw new ProductVariationNotFoundError({ productVariationId });

  return modules.products.variations.texts.updateVariationTexts(
    productVariationId,
    texts,
    productVariationOptionValue,
    userId,
  );
}
