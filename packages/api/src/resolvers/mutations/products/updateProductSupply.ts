import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';
import { type ProductSupply, ProductType } from '@unchainedshop/core-products';
import { ProductNotFoundError, InvalidIdError, ProductWrongTypeError } from '../../../errors.ts';

export default async function updateProductSupply(
  root: never,
  { supply, productId }: { supply: ProductSupply; productId: string },
  { modules, userId }: Context,
) {
  log(`mutation updateProductSupply ${productId}`, { userId });

  if (!productId) throw new InvalidIdError({ productId });

  const product = await modules.products.findProduct({ productId });
  if (!product) throw new ProductNotFoundError({ productId });

  if (product?.type !== ProductType.SIMPLE_PRODUCT)
    throw new ProductWrongTypeError({
      productId,
      received: product?.type,
      required: ProductType.SIMPLE_PRODUCT,
    });

  await modules.products.update(productId, { supply });

  return modules.products.findProduct({ productId });
}
