import type { Context } from '../../../../context.ts';
import { ProductType } from '@unchainedshop/core-products';
import { ProductNotFoundError, ProductWrongTypeError } from '../../../../errors.ts';
import type { Params } from '../schemas.ts';

export default async function simulatePriceRange(
  context: Context,
  params: Params<'SIMULATE_PRICE_RANGE'>,
) {
  const { useNetPrice, productId, currencyCode, quantity, vectors } = params;
  const { modules, services } = context;
  const product = await modules.products.findProduct({ productId });
  if (!product) throw new ProductNotFoundError({ productId });

  if (product.type !== ProductType.CONFIGURABLE_PRODUCT) {
    throw new ProductWrongTypeError({
      productId,
      received: product.type,
      required: ProductType.CONFIGURABLE_PRODUCT,
    });
  }

  return {
    priceRange: await services.products.simulateConfigurablePriceRange({
      product,
      currencyCode: currencyCode || context.currencyCode,
      countryCode: context.countryCode,
      quantity,
      useNetPrice,
      vectors,
      user: context.user,
    }),
  };
}
