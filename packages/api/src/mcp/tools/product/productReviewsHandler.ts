import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';

const SortDirectionEnum = z.enum(['asc', 'desc']); // assuming these are your directions

export const ProductReviewsSchema = {
  limit: z.number().int().min(1).max(100).default(10).describe('Number of reviews to return'),
  offset: z.number().int().min(0).default(0).describe('Number of reviews to skip'),
  sort: z
    .array(
      z.object({
        key: z.string().min(1).describe('Field to sort by'),
        value: SortDirectionEnum.describe('Sort direction: asc or desc'),
      }),
    )
    .optional()
    .describe('Sort options'),
  queryString: z.string().optional().describe('Optional filter query'),
};

export const ProductReviewsZodSchema = z.object(ProductReviewsSchema);

export type ProductReviewsParams = z.infer<typeof ProductReviewsZodSchema>;

export async function productReviewsHandler(context: Context, params: ProductReviewsParams) {
  const { limit, offset, queryString } = params;
  const { modules, userId } = context;

  try {
    log(`query productReviews: ${limit} ${offset} ${queryString || ''}`, {
      userId,
    });

    const reviews = await modules.products.reviews.findProductReviews(params as any);
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ reviews }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error fetching product reviews: ${(error as Error).message}`,
        },
      ],
    };
  }
}
