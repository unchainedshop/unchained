import { Context } from '../../../types.js';
import { log } from '@unchainedshop/logger';
import { InvalidIdError, ProductNotFoundError, ProductWrongStatusError } from '../../../errors.js';

export default async function publishProduct(
  root: never,
  { productId }: { productId: string },
  { modules, userId }: Context,
) {
  log(`mutation publishProduct ${productId}`, { userId });

  if (!productId) throw new InvalidIdError({ productId });

  const product = await modules.products.findProduct({ productId });
  if (!product) throw new ProductNotFoundError({ productId });

  if (!(await modules.products.publish(product))) {
    throw new ProductWrongStatusError({ status: product.status });
  }

  return modules.products.findProduct({ productId });
}
