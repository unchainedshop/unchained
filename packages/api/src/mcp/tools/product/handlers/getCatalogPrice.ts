import type { Context } from '../../../../context.ts';
import { ProductNotFoundError } from '../../../../errors.ts';
import type { Params } from '../schemas.ts';

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
  if (!pricing) return { price: null };

  const price = {
    ...pricing.unitPrice({}),
    isNetPrice: false,
    isTaxable: pricing.taxSum() !== 0,
    currencyCode: pricing.currencyCode,
  };
  return { price };
}
