import { Context } from '../../../../context.js';
import { ProductTypes } from '@unchainedshop/core-products';
import { ProductNotFoundError, ProductWrongTypeError } from '../../../../errors.js';
import { getNormalizedProductDetails } from '../../../utils/getNormalizedProductDetails.js';
import { Params } from '../schemas.js';

export default async function getBundleItems(context: Context, params: Params<'GET_BUNDLE_ITEMS'>) {
  const { modules } = context;
  const { bundleId } = params;

  const bundle = await modules.products.findProduct({ productId: bundleId });
  if (!bundle) throw new ProductNotFoundError({ productId: bundleId });

  if (bundle.type !== ProductTypes.BundleProduct) {
    throw new ProductWrongTypeError({
      productId: bundleId,
      received: bundle.type,
      required: ProductTypes.BundleProduct,
    });
  }

  const bundleItems = await Promise.all(
    (bundle.bundleItems || []).map(async (item, index) => ({
      ...item,
      index,
      product: await getNormalizedProductDetails(item.productId, context),
    })),
  );

  return { bundleItems };
}
