import { Context } from '../../../../context.js';
import { ProductTypes } from '@unchainedshop/core-products';
import {
  CyclicProductBundlingNotSupportedError,
  ProductNotFoundError,
  ProductWrongTypeError,
} from '../../../../errors.js';
import { getNormalizedProductDetails } from '../../../utils/getNormalizedProductDetails.js';
import { Params } from '../schemas.js';

export default async function addBundleItem(context: Context, params: Params<'ADD_BUNDLE_ITEM'>) {
  const { modules } = context;
  const { bundleId, bundleProductId, quantity } = params;
  const product = await modules.products.findProduct({ productId: bundleId });
  if (!product) throw new ProductNotFoundError({ productId: bundleId });

  if (product.type !== ProductTypes.BundleProduct)
    throw new ProductWrongTypeError({
      productId: bundleId,
      received: product.type,
      required: ProductTypes.BundleProduct,
    });

  const itemProduct = await modules.products.findProduct({ productId: bundleProductId });
  if (!itemProduct) throw new ProductNotFoundError({ productId: bundleProductId });

  if (itemProduct._id === product._id)
    throw new CyclicProductBundlingNotSupportedError({
      productId: itemProduct._id,
    });

  await modules.products.bundleItems.addBundleItem(bundleId, {
    productId: bundleProductId,
    quantity,
    configuration: [],
  });

  return { product: await getNormalizedProductDetails(bundleId, context) };
}
