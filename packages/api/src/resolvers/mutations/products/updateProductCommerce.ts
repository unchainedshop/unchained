import { log } from '@unchainedshop/logger';
import { ProductCommerce, ProductTypes } from '@unchainedshop/core-products';
import { ProductNotFoundError, InvalidIdError, ProductWrongTypeError } from '../../../errors.js';
import { Context } from '../../../context.js';

export default async function updateProductCommerce(
  root: never,
  { commerce, productId }: { commerce: ProductCommerce; productId: string },
  { modules, userId }: Context,
) {
  log(`mutation updateProductCommerce ${productId}`, { userId });

  if (!productId) throw new InvalidIdError({ productId });

  const product = await modules.products.findProduct({ productId });
  if (!product) throw new ProductNotFoundError({ productId });

  if (product.type === ProductTypes.ConfigurableProduct) {
    throw new ProductWrongTypeError({
      productId: productId,
      received: product.type,
      required: { not: ProductTypes.ConfigurableProduct },
    });
  }

  await modules.products.update(productId, { commerce });

  return modules.products.findProduct({ productId });
}
