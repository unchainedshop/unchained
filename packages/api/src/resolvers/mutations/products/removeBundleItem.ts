import { log } from '@unchainedshop/logger';
import { ProductTypes } from '@unchainedshop/core-products';
import { Context } from '../../../context.js';
import { ProductNotFoundError, InvalidIdError, ProductWrongTypeError } from '../../../errors.js';

export default async function removeBundleItem(
  root: never,
  { productId, index }: { productId: string; index: number },
  { modules, userId }: Context,
) {
  log(`mutation removeBundleItem ${productId} ${index}`, { userId });

  if (!productId) throw new InvalidIdError({ productId });

  const product = await modules.products.findProduct({ productId });
  if (!product) throw new ProductNotFoundError({ productId });

  if (product.type !== ProductTypes.BundleProduct)
    throw new ProductWrongTypeError({
      productId,
      received: product.type,
      required: ProductTypes.BundleProduct,
    });

  await modules.products.bundleItems.removeBundleItem(productId, index);

  return modules.products.findProduct({ productId });
}
