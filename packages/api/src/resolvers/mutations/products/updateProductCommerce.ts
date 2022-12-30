import { log } from '@unchainedshop/logger';
import { Root, Context } from '@unchainedshop/types/api.js';
import { ProductCommerce } from '@unchainedshop/types/products.js';
import { ProductNotFoundError, InvalidIdError } from '../../../errors.js';

export default async function updateProductCommerce(
  root: Root,
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
