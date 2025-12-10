import { log } from '@unchainedshop/logger';
import { ProductType } from '@unchainedshop/core-products';
import type { Context } from '../../../context.ts';
import { ProductNotFoundError, InvalidIdError, ProductWrongTypeError } from '../../../errors.ts';

export default async function removeBundleItem(
  root: never,
  { productId, index }: { productId: string; index: number },
  { modules, userId }: Context,
) {
  log(`mutation removeBundleItem ${productId} ${index}`, { userId });

  if (!productId) throw new InvalidIdError({ productId });

  const product = await modules.products.findProduct({ productId });
  if (!product) throw new ProductNotFoundError({ productId });

  if (product.type !== ProductType.BUNDLE_PRODUCT)
    throw new ProductWrongTypeError({
      productId,
      received: product.type,
      required: ProductType.BUNDLE_PRODUCT,
    });

  await modules.products.bundleItems.removeBundleItem(productId, index);

  return modules.products.findProduct({ productId });
}
