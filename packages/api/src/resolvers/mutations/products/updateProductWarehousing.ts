import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';

import { ProductType, type ProductWarehousing } from '@unchainedshop/core-products';
import { ProductNotFoundError, InvalidIdError, ProductWrongTypeError } from '../../../errors.ts';

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
