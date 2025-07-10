import { z } from 'zod';
import { Context } from '../../../context.js';
import { ProductNotFoundError, ProductWrongTypeError } from '../../../errors.js';
import { log } from '@unchainedshop/logger';
import { getNormalizedProductDetails } from '../../utils/getNormalizedProductDetails.js';
import { ProductTypes } from '@unchainedshop/core-products';

export const RemoveProductBundleItemSchema = {
  productId: z.string().min(1).describe('ID of the BUNDLE_PRODUCT from which the item will be removed'),
  index: z.number().int().min(0).describe('0-based index of the bundle item to remove'),
};

export const RemoveProductBundleItemZodSchema = z.object(RemoveProductBundleItemSchema);

export type RemoveProductBundleItemParams = z.infer<typeof RemoveProductBundleItemZodSchema>;

export const removeProductBundleItemHandler = async (
  context: Context,
  params: RemoveProductBundleItemParams,
) => {
  const { modules, userId } = context;
  const { productId, index } = params;

  log('handler removeProductBundleItemHandler', { userId, params });
  try {
    const product = await modules.products.findProduct({ productId });
    if (!product) throw new ProductNotFoundError({ productId });

    if (product.type !== ProductTypes.BundleProduct)
      throw new ProductWrongTypeError({
        productId,
        received: product.type,
        required: ProductTypes.BundleProduct,
      });

    await modules.products.bundleItems.removeBundleItem(productId, index);
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ product: await getNormalizedProductDetails(productId, context) }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error removing bundle item: ${(error as Error).message}`,
        },
      ],
    };
  }
};
