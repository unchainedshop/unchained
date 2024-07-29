import { log } from '@unchainedshop/logger';
import { ProductCommerce } from '@unchainedshop/core-products';
import { ProductNotFoundError, InvalidIdError } from '../../../errors.js';
import { Context } from '../../../types.js';

export default async function updateProductCommerce(
  root: never,
  { commerce, productId }: { commerce: ProductCommerce; productId: string },
  { modules, userId }: Context,
) {
  log(`mutation updateProductCommerce ${productId}`, { userId });

  if (!productId) throw new InvalidIdError({ productId });

  if (!(await modules.products.productExists({ productId })))
    throw new ProductNotFoundError({ productId });

  await modules.products.update(productId, { commerce });

  return modules.products.findProduct({ productId });
}
