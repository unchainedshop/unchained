import { log } from 'meteor/unchained:core-logger';
import { ProductVariations } from 'meteor/unchained:core-products';
import { ProductVariationNotFoundError, InvalidIdError } from '../../errors';

export default function createProductVariationOption(
  root,
  { option: inputData, productVariationId },
  { localeContext, userId }
) {
  log(`mutation createProductVariationOption ${productVariationId}`, {
    userId,
  });
  if (!productVariationId) throw new InvalidIdError({ productVariationId });
  const variation = ProductVariations.findOne({ _id: productVariationId });
  if (!variation)
    throw new ProductVariationNotFoundError({ productVariationId });

  return variation.createVariationOption({ inputData, localeContext, userId });
}
