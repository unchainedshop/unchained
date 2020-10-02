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
  ProductVariations.update(
    { _id: productVariationId },
    {
      $set: {
        updated: new Date(),
      },
      $pull: {
        options: productVariationOptionValue,
      },
    }
  );
  const productVariation = ProductVariations.findOne({
    _id: productVariationId,
  });
  if (!productVariation)
    throw new ProductVariationNotFoundError({ productVariationId });

  return productVariation;
}
