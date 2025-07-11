import { Context } from '../../../context.js';
import { ProductNotFoundError, ProductWrongTypeError } from '../../../errors.js';
import { getNormalizedProductDetails } from '../../utils/getNormalizedProductDetails.js';
import { ProductTypes } from '@unchainedshop/core-products';
import { log } from '@unchainedshop/logger';
import { z } from 'zod';

export const ProductBundleItemsSchema = {
  productId: z.string().min(1).describe('ID of the product of type BUNDLE to retrieve its bundle items'),
};

export const ProductBundleItemsZodSchema = z.object(ProductBundleItemsSchema);
export type ProductBundleItemsParams = z.infer<typeof ProductBundleItemsZodSchema>;

export const productBundleItemsHandler = async (context: Context, params: ProductBundleItemsParams) => {
  const { modules, userId } = context;
  const { productId } = params;

  log('handler productBundleItemsHandler', { userId, params });
  try {
    const product = await modules.products.findProduct({ productId });
    if (!product) throw new ProductNotFoundError({ productId });

    if (product.type !== ProductTypes.BundleProduct) {
      throw new ProductWrongTypeError({
        productId,
        received: product.type,
        required: ProductTypes.BundleProduct,
      });
    }

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
          text: `Error fetching bundle items: ${(error as Error).message}`,
        },
      ],
    };
  }
};
