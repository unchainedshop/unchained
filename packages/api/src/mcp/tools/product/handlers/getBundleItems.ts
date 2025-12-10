import { ProductType } from '@unchainedshop/core-products';
import { Context } from '../../../../context.js';
import { ProductNotFoundError, ProductWrongTypeError } from '../../../../errors.js';
import { getNormalizedProductDetails } from '../../../utils/getNormalizedProductDetails.js';
import { Params } from '../schemas.js';

export default async function getBundleItems(context: Context, params: Params<'GET_BUNDLE_ITEMS'>) {
  const { modules } = context;
  const { bundleId } = params;

  const bundle = await modules.products.findProduct({ productId: bundleId });
  if (!bundle) throw new ProductNotFoundError({ productId: bundleId });

  if (bundle.type !== ProductType.BUNDLE_PRODUCT) {
    throw new ProductWrongTypeError({
      productId: bundleId,
      received: bundle.type,
      required: ProductType.BUNDLE_PRODUCT,
    });
  }
  return { product: await getNormalizedProductDetails(bundleId, context) };
}
