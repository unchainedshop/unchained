import { log } from 'meteor/unchained:logger';
import { Products } from 'meteor/unchained:core-products';
import { Quotations } from 'meteor/unchained:core-quotations';
import { ProductNotFoundError, InvalidIdError } from '../../../errors';

export default async function requestQuotation(
  root: Root,
  { productId, configuration },
  { userId, countryContext, localeContext }
) {
  log(
    `mutation requestQuotation ${productId} ${
      configuration ? JSON.stringify(configuration) : ''
    }`,
    { userId }
  );
  if (!productId) throw new InvalidIdError({ productId });
  if (!Products.productExists({ productId }))
    throw new ProductNotFoundError({ productId });
  return Quotations.requestQuotation(
    {
      userId,
      productId,
      countryCode: countryContext,
      configuration,
    },
    { localeContext }
  );
}
