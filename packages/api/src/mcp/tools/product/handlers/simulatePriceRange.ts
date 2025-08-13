import { Context } from '../../../../context.js';
import { ProductTypes } from '@unchainedshop/core-products';
import { ProductNotFoundError, ProductWrongTypeError } from '../../../../errors.js';
import { Params } from '../schemas.js';

export default async function simulatePriceRange(
  context: Context,
  params: Params<'SIMULATE_PRICE_RANGE'>,
) {
  const { useNetPrice, productId, currencyCode, quantity, vectors } = params;
  const { modules, services } = context;
  const product = await modules.products.findProduct({ productId });
  if (!product) throw new ProductNotFoundError({ productId });

  if (product.type !== ProductTypes.ConfigurableProduct) {
    throw new ProductWrongTypeError({
      productId,
      received: product.type,
      required: ProductTypes.ConfigurableProduct,
    });
  }

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
  const minPrice = pricing.unitPrice({ useNetPrice });
  const maxPrice = pricing.unitPrice({ useNetPrice });

  return {
    min: minPrice,
    max: maxPrice,
    isNetPrice: useNetPrice,
    currencyCode: pricing.currencyCode,
  };
}
