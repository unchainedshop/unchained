import { Context, Root } from '@unchainedshop/types/api';
import { log } from '@unchainedshop/logger';
import { InvalidIdError, ProductNotFoundError, ProductWrongStatusError } from '../../../errors';

export default async function publishProduct(
  root: Root,
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
