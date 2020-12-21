import { log } from 'meteor/unchained:core-logger';
import { ProductVariations } from 'meteor/unchained:core-products';
import { InvalidIdError, ProductVariationNotFoundError } from '../../errors';

export default function removeProductVariationOption(
  root,
  { productVariationId, productVariationOptionValue },
  { userId }
) {
  log(
    `mutation removeProductVariationOption ${productVariationId} ${productVariationOptionValue}`,
    { userId }
  );
  if (!productVariationId) throw new InvalidIdError({ productVariationId });

  const productVariation = ProductVariations.findOne({
    _id: productVariationId,
  });
  if (!productVariation)
    throw new ProductVariationNotFoundError({ productVariationId });

  return productVariation.removeVariationOption({
    productVariationOptionValue,
  });
}
