import { log } from '@unchainedshop/logger';
import type { Product } from '@unchainedshop/core-products';
import { ProductNotFoundError, InvalidIdError } from '../../../errors.ts';
import type { Context } from '../../../context.ts';

export default async function updateProduct(
  root: never,
  { product, productId }: { product: Product; productId: string },
  { modules, userId }: Context,
) {
  log(`mutation updateProduct ${productId}`, { userId });

  if (!productId) throw new InvalidIdError({ productId });

  if (!(await modules.products.productExists({ productId })))
    throw new ProductNotFoundError({ productId });

  await modules.products.update(productId, product);

  return modules.products.findProduct({ productId });
}
