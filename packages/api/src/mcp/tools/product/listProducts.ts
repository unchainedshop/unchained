import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { getNormalizedProductDetails } from '../../utils/getNormalizedProductDetails.js';

const SortOptionInputSchema = z.object({
  key: z.string().min(1).describe('Field to sort by'),
  value: z.enum(['ASC', 'DESC']).describe('Sort direction'),
});

export const ProductsListSchema = {
  queryString: z.string().optional().describe('Free-text filter for products'),
  tags: z.array(z.string().min(1).toLowerCase()).optional().describe('Filter by lowercase tags'),
  slugs: z.array(z.string().min(1)).optional().describe('Filter by product slugs'),
  limit: z.number().int().min(1).max(100).default(10).describe('Maximum number of products to return'),
  offset: z.number().int().min(0).default(0).describe('Number of products to skip'),
  includeDrafts: z.boolean().default(false).describe('Whether to include draft (unpublished) products'),
  sort: z.array(SortOptionInputSchema).optional().describe('Sorting options'),
};

export const ProductsListZodSchema = z.object(ProductsListSchema);

export type ProductsListParams = z.infer<typeof ProductsListZodSchema>;

export async function productsListHandler(context: Context, params: ProductsListParams) {
  const { modules, userId } = context;

  try {
    log('handler productsListHandler', { userId, params });

    const products = await modules.products.findProducts(params as any);
    const normalizedProducts = await Promise.all(
      products.map(async ({ _id }) => getNormalizedProductDetails(_id, context)),
    );

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            products: normalizedProducts,
          }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error fetching products: ${(error as Error).message}`,
        },
      ],
    };
  }
}
