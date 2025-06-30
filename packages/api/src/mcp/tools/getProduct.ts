import { z } from 'zod';
import { Context } from '../../context.js';
import { getNormalizedProductDetails } from '../utils/getNormalizedProductDetails.js';

/**
 * Zod schema for the get_product tool (as raw object for MCP)
 */
export const GetProductSchema = {
  productId: z.string().optional().describe('Product ID for lookup'),
  slug: z.string().optional().describe('Product slug for lookup'),
  sku: z.string().optional().describe('Product SKU for lookup'),
};

/**
 * Zod object schema for type inference and validation
 */
export const GetProductZodSchema = z
  .object(GetProductSchema)
  .refine(
    (data) => data.productId || data.slug || data.sku,
    'At least one of productId, slug, or sku must be provided',
  );

/**
 * Interface for the get_product tool parameters
 */
export type GetProductParams = z.infer<typeof GetProductZodSchema>;

/**
 * Implementation of the get_product tool
 */
export async function getProductHandler(context: Context, params: GetProductParams) {
  const { productId, slug, sku } = params;

  try {
    // Find the product
    const product = await context.modules.products.findProduct({
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
