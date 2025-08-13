import { Context } from '../../../../context.js';
import { ProductNotFoundError } from '../../../../errors.js';
import { getNormalizedProductDetails } from '../../../utils/getNormalizedProductDetails.js';
import { Params } from '../schemas.js';

export default async function simulatePrice(context: Context, params: Params<'SIMULATE_PRICE'>) {
  const { services } = context;
  const { productId, vectors = [], quantity = 1, currencyCode, useNetPrice = false } = params;
  const product = await getNormalizedProductDetails(productId, context);
  if (!product) throw new ProductNotFoundError({ productId });

  const currency = currencyCode || context.currencyCode;
  const pricingContext = {
    product,
    user: context.user,
    countryCode: context.countryCode,
    currencyCode: currency,
    quantity,
    configuration: vectors,
  };

  const pricing = await services.products.simulateProductPricing(pricingContext as any);
  const unitPrice = pricing.unitPrice({ useNetPrice });

  const price = {
    ...unitPrice,
    isNetPrice: useNetPrice,
    isTaxable: pricing.taxSum() > 0,
    currencyCode: pricing.currencyCode,
  };
  return { price };
}
