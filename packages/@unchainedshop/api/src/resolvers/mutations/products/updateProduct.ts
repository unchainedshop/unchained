import { log } from '@unchainedshop/logger';
import { Root, Context } from '@unchainedshop/types/api';
import { Product } from '@unchainedshop/types/products';
import { ProductNotFoundError, InvalidIdError } from '../../../errors';

export default async function updateProduct(
  root: Root,
  { product, productId }: { product: Product; productId: string },
  { modules, userId }: Context,
) {
  log(`mutation updateProduct ${productId}`, { userId });

  if (!productId) throw new InvalidIdError({ productId });

  if (!(await modules.products.productExists({ productId })))
    throw new ProductNotFoundError({ productId });

  await modules.products.update(productId, product, userId);

  return modules.products.findProduct({ productId });
}
