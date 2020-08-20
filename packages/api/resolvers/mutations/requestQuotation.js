import { log } from 'meteor/unchained:core-logger';
import { Products } from 'meteor/unchained:core-products';
import { Quotations } from 'meteor/unchained:core-quotations';
import { ProductNotFoundError, InvalidIdError } from '../../errors';

export default function (
  root,
  { productId, configuration },
  { userId, countryContext, localeContext },
) {
  log(
    `mutation requestQuotation ${productId} ${
      configuration ? JSON.stringify(configuration) : ''
    }`,
    { userId },
  );
  if (!productId) throw new InvalidIdError({ productId });
  const product = Products.findOne({ _id: productId });
  if (!product) throw new ProductNotFoundError({ productId });
  const quotation = Quotations.requestQuotation(
    {
      userId,
      productId,
      countryCode: countryContext,
      configuration,
    },
    { localeContext },
  );
  return quotation;
}
