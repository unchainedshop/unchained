import { Context } from '../../../../context.js';
import { ProductTypes } from '@unchainedshop/core-products';
import { ProductNotFoundError, ProductWrongTypeError } from '../../../../errors.js';
import { getNormalizedProductDetails } from '../../../utils/getNormalizedProductDetails.js';
import { Params } from '../schemas.js';

export default async function addBundleItem(context: Context, params: Params<'ADD_BUNDLE_ITEM'>) {
  const { modules } = context;
  const { bundleId, bundleProductId, quantity } = params;

  const bundle = await modules.products.findProduct({ productId: bundleId });
  if (!bundle) throw new ProductNotFoundError({ productId: bundleId });

  if (bundle.type !== ProductTypes.BundleProduct) {
    throw new ProductWrongTypeError({
      productId: bundleId,
      received: bundle.type,
      required: ProductTypes.BundleProduct,
    });
  }

  const bundleProduct = await modules.products.findProduct({ productId: bundleProductId });
  if (!bundleProduct) throw new ProductNotFoundError({ productId: bundleProductId });

  await modules.products.update(bundleId, {
    ...bundle,
    bundleItems: [
      ...(bundle.bundleItems || []),
      {
        productId: bundleProductId,
        quantity: quantity || 1,
      },
    ],
  });

  const product = await getNormalizedProductDetails(bundleId, context);
  return { product };
}
