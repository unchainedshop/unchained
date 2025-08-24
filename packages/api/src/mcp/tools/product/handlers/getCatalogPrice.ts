import { Context } from '../../../../context.js';
import { ProductNotFoundError } from '../../../../errors.js';
import { Params } from '../schemas.js';

export default async function getCatalogPrice(context: Context, params: Params<'GET_CATALOG_PRICE'>) {
  const { modules, services } = context;
  const { productId, quantity = 1, currencyCode } = params;

  const product = await modules.products.findProduct({ productId });
  if (!product) throw new ProductNotFoundError({ productId });

  const currency = currencyCode || context.currencyCode;

  const pricingContext = {
    product,
    user: context.user,
    countryCode: context.countryCode,
    currencyCode: currency,
    quantity,
  };

  const pricing = await services.products.simulateProductPricing(pricingContext as any);
  const unitPrice = pricing?.unitPrice();

  const price = {
    ...unitPrice,
    isTaxable: pricing?.taxSum() > 0,
    currencyCode: pricing?.currencyCode,
  };
  return { price };
}
