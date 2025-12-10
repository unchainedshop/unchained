import { ProductType } from '@unchainedshop/core-products';
import type { Context } from '../../../../context.ts';
import { ProductNotFoundError, ProductWrongTypeError } from '../../../../errors.ts';
import { getNormalizedProductDetails } from '../../../utils/getNormalizedProductDetails.ts';
import type { Params } from '../schemas.ts';

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
