import { log } from '@unchainedshop/logger';
import { Root, Context } from '@unchainedshop/types/api.js';
import { Product } from '@unchainedshop/types/products.js';
import { ProductNotFoundError, InvalidIdError } from '../../../errors.js';

export default async function updateProduct(
  root: Root,
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
