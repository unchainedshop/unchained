import { z } from 'zod';
import { Context } from '../../../context.js';
import { ProductNotFoundError, ProductWrongTypeError } from '../../../errors.js';
import { log } from '@unchainedshop/logger';
import { getNormalizedProductDetails } from '../../utils/getNormalizedProductDetails.js';

const VariationProductsVectorSchema = z.object({
  key: z.string().min(1),
  value: z.string().min(1),
});

export const VariationProductsSchema = {
  productId: z.string().min(1),
  vectors: z.array(VariationProductsVectorSchema).min(1),
  includeInactive: z.boolean().optional().default(true).describe('Whether to include inactive products'),
};
export const VariationProductsZodSchema = z.object(VariationProductsSchema);
export type VariationProductsParams = z.infer<typeof VariationProductsZodSchema>;

export const variationProductsHandler = async (context: Context, params: VariationProductsParams) => {
  const { modules, userId } = context;
  const { productId, vectors, includeInactive } = params;

  try {
    log('handler variationProductsHandler', { userId, params });
    const product = await modules.products.findProduct({ productId });
    if (!product) throw new ProductNotFoundError({ productId });

    if (product.type !== 'CONFIGURABLE_PRODUCT') {
      throw new ProductWrongTypeError({
        productId,
        received: product.type,
        required: 'CONFIGURABLE_PRODUCT',
      });
    }

    const products = await modules.products.proxyProducts(product, vectors as any, {
      includeInactive,
    });
    const normalizedProducts = await Promise.all(
      products.map(async ({ _id }) => getNormalizedProductDetails(_id, context)),
    );
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ products: normalizedProducts }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error fetching variation products: ${(error as Error).message}`,
        },
      ],
    };
  }
};
