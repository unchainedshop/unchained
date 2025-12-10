import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';
import { ProductNotFoundError, ProductWrongStatusError, InvalidIdError } from '../../../errors.ts';

export default async function unpublishProduct(
  root: never,
  { productId }: { productId: string },
  { modules, userId }: Context,
) {
  log(`mutation unpublishProduct ${productId}`, { userId });

  if (!productId) throw new InvalidIdError({ productId });

  const product = await modules.products.findProduct({ productId });
  if (!product) throw new ProductNotFoundError({ productId });

  if (!(await modules.products.unpublish(product))) {
    throw new ProductWrongStatusError({ status: product.status });
  }

  return modules.products.findProduct({ productId });
}
