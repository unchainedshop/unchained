import { log } from '@unchainedshop/logger';
import { type ProductCommerce, ProductType } from '@unchainedshop/core-products';
import { ProductNotFoundError, InvalidIdError, ProductWrongTypeError } from '../../../errors.ts';
import type { Context } from '../../../context.ts';

export default async function updateProductCommerce(
  root: never,
  { commerce, productId }: { commerce: ProductCommerce; productId: string },
  { modules, userId }: Context,
) {
  log(`mutation updateProductCommerce ${productId}`, { userId });

  if (!productId) throw new InvalidIdError({ productId });

  const product = await modules.products.findProduct({ productId });
  if (!product) throw new ProductNotFoundError({ productId });

  if (product.type === ProductType.CONFIGURABLE_PRODUCT) {
    throw new ProductWrongTypeError({
      productId: productId,
      received: product.type,
      required: { not: ProductType.CONFIGURABLE_PRODUCT },
    });
  }

  // Normalize quantity tiers: an omitted minQuantity is the base tier (0);
  // an explicit floor must be >= 0.
  const normalizedCommerce: ProductCommerce = {
    ...commerce,
    pricing: commerce?.pricing?.map((priceLevel) => {
      if (priceLevel.minQuantity != null && priceLevel.minQuantity < 0) {
        throw new Error('minQuantity must be greater than or equal to 0');
      }
      return { ...priceLevel, minQuantity: priceLevel.minQuantity ?? 0 };
    }),
  };

  await modules.products.update(productId, { commerce: normalizedCommerce });

  return modules.products.findProduct({ productId });
}
