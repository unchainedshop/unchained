import { Context } from '../../../../context.js';
import { ProductType } from '@unchainedshop/core-products';
import { ProductNotFoundError, ProductWrongTypeError } from '../../../../errors.js';
import { Params } from '../schemas.js';

export default async function removeBundleItem(context: Context, params: Params<'REMOVE_BUNDLE_ITEM'>) {
  const { modules } = context;
  const { bundleId, index } = params;

  const bundle = await modules.products.findProduct({ productId: bundleId });
  if (!bundle) throw new ProductNotFoundError({ productId: bundleId });

  if (bundle.type !== ProductType.BUNDLE_PRODUCT) {
    throw new ProductWrongTypeError({
      productId: bundleId,
      received: bundle.type,
      required: ProductType.BUNDLE_PRODUCT,
    });
  }

  const bundleItems = [...(bundle.bundleItems || [])];
  if (index >= bundleItems.length || index < 0) {
    throw new Error('Invalid bundle item index');
  }

  bundleItems.splice(index, 1);

  await modules.products.update(bundleId, {
    ...bundle,
    bundleItems,
  });

  return { success: true };
}
