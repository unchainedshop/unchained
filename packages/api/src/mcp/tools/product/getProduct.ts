import { z } from 'zod';
import { Context } from '../../../context.js';
import { getNormalizedProductDetails } from '../../utils/getNormalizedProductDetails.js';
import { log } from '@unchainedshop/logger';

export const GetProductSchema = {
  productId: z.string().optional().describe('Product ID for lookup'),
  slug: z.string().optional().describe('Product slug for lookup'),
  sku: z.string().optional().describe('Product SKU for lookup'),
};

export const GetProductZodSchema = z
  .object(GetProductSchema)
  .refine(
    (data) => data.productId || data.slug || data.sku,
    'At least one of productId, slug, or sku must be provided',
  );

export type GetProductParams = z.infer<typeof GetProductZodSchema>;

export async function getProductHandler(context: Context, params: GetProductParams) {
  const { productId, slug, sku } = params;
  const { modules, userId } = context;

  try {
    log('handler getProductHandler', { userId, params });
    const product = await modules.products.findProduct({
      productId,
      slug,
      sku,
    });

    if (!product) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Product not found with ${productId ? `ID: ${productId}` : slug ? `slug: ${slug}` : `SKU: ${sku}`}`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            product: await getNormalizedProductDetails(productId, context),
          }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error getting product: ${(error as Error).message}`,
        },
      ],
    };
  }
}
