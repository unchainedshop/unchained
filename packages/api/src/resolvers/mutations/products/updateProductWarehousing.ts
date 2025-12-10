import { log } from '@unchainedshop/logger';
import { Context } from '../../../context.js';

import { ProductType, ProductWarehousing } from '@unchainedshop/core-products';
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

  if (product?.type !== ProductType.SIMPLE_PRODUCT)
    throw new ProductWrongTypeError({
      productId,
      received: product.type,
      required: ProductType.SIMPLE_PRODUCT,
    });

  await modules.products.update(productId, { warehousing });

  return modules.products.findProduct({ productId });
}
