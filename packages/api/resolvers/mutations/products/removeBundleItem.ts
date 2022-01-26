import { log } from 'meteor/unchained:logger';
import { ProductTypes } from 'meteor/unchained:core-products';
import { Context, Root } from '@unchainedshop/types/api';
import {
  ProductNotFoundError,
  InvalidIdError,
  ProductWrongTypeError,
} from '../../../errors';

export default async function removeBundleItem(
  root: Root,
  { productId, index }: { productId: string; index: number },
  { modules, userId }: Context
) {
  log(`mutation removeBundleItem ${productId}`, { index });

  if (!productId) throw new InvalidIdError({ productId });

  const product = await modules.products.findProduct({ productId });
  if (!product) throw new ProductNotFoundError({ productId });

  if (product.type !== ProductTypes.BundleProduct)
    throw new ProductWrongTypeError({
      productId,
      received: product.type,
      required: ProductTypes.BundleProduct,
    });

  await modules.products.bundleItems.removeBundleItem(productId, index, userId);

  return modules.products.findProduct({ productId });
}
