import { log } from '@unchainedshop/logger';
import { ProductTypes } from '@unchainedshop/core-products';
import { Context } from '../../../context.js';
import { ProductBundleItem } from '@unchainedshop/core-products';
import {
  ProductNotFoundError,
  InvalidIdError,
  ProductWrongTypeError,
  CyclicProductBundlingNotSupportedError,
} from '../../../errors.js';

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

  const itemProduct = await modules.products.findProduct({ productId: item.productId });
  if (!itemProduct) throw new ProductNotFoundError({ productId: item.productId });

  if (itemProduct._id === product._id)
    throw new CyclicProductBundlingNotSupportedError({
      productId: itemProduct._id,
    });

  await modules.products.bundleItems.addBundleItem(productId, item);

  return modules.products.findProduct({ productId });
}
