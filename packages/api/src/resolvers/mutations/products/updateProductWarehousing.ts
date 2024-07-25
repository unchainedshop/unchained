import { log } from '@unchainedshop/logger';
import { ProductTypes } from '@unchainedshop/core-products';
import { Context } from '../../../types.js';

import { ProductWarehousing } from '@unchainedshop/types/products.js';
import { ProductNotFoundError, InvalidIdError, ProductWrongTypeError } from '../../../errors.js';

export default async function updateProductWarehousing(
  root: never,
  { warehousing, productId }: { warehousing: ProductWarehousing; productId: string },
  { modules, userId }: Context,
) {
  log(`mutation updateProductWarehousing ${productId}`, { userId });

  if (!productId) throw new InvalidIdError({ productId });

  const product = await modules.products.findProduct({ productId });
  if (!product) throw new ProductNotFoundError({ productId });

  if (product?.type !== ProductTypes.SimpleProduct)
    throw new ProductWrongTypeError({
      productId,
      received: product.type,
      required: ProductTypes.SimpleProduct,
    });

  await modules.products.update(productId, { warehousing });

  return modules.products.findProduct({ productId });
}
