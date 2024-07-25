import { log } from '@unchainedshop/logger';
import { ProductTypes } from '@unchainedshop/core-products';
import { Context } from '../../../types.js';
import { ProductBundleItem } from '@unchainedshop/types/products.js';
import { ProductNotFoundError, InvalidIdError, ProductWrongTypeError } from '../../../errors.js';

export default async function createProductBundleItem(
  root: never,
  { productId, item }: { productId: string; item: ProductBundleItem },
  { modules, userId }: Context,
) {
  log(`mutation createProductBundleItem ${productId}`, { userId, item });

  if (!productId) throw new InvalidIdError({ productId });
  if (!item.productId) throw new InvalidIdError({ bundleItemId: item.productId });

  const product = await modules.products.findProduct({ productId });
  if (!product) throw new ProductNotFoundError({ productId });

  if (product.type !== ProductTypes.BundleProduct)
    throw new ProductWrongTypeError({
      productId,
      received: product.type,
      required: ProductTypes.BundleProduct,
    });

  if (!(await modules.products.productExists({ productId: item.productId })))
    throw new ProductNotFoundError({ productId: item.productId });

  await modules.products.bundleItems.addBundleItem(productId, item);

  return modules.products.findProduct({ productId });
}
