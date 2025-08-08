import { z } from 'zod';
import { Context } from '../../../context.js';
import { ProductNotFoundError, ProductWrongTypeError } from '../../../errors.js';
import { log } from '@unchainedshop/logger';
import { getNormalizedProductDetails } from '../../utils/getNormalizedProductDetails.js';

export const ProductVariationsSchema = {
  productId: z.string().min(1).describe('ID of the CONFIGURABLE_PRODUCT to retrieve variations from'),
};

export const ProductVariationsZodSchema = z.object(ProductVariationsSchema);
export type ProductVariationsParams = z.infer<typeof ProductVariationsZodSchema>;

export const productVariationsHandler = async (context: Context, params: ProductVariationsParams) => {
  const { productId } = params;
  const { modules, userId } = context;

  try {
    log('handler productVariationsHandler', { userId, productId });

    const product = await modules.products.findProduct({ productId });
    if (!product) throw new ProductNotFoundError({ productId });

    if (product.type !== 'CONFIGURABLE_PRODUCT') {
      throw new ProductWrongTypeError({
        productId,
        received: product.type,
        required: 'CONFIGURABLE_PRODUCT',
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
          text: `Error fetching variations: ${(error as Error).message}`,
        },
      ],
    };
  }
};
