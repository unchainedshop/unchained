import { z } from 'zod';
import { Context } from '../../../context.js';

export const ProductReviewsCountSchema = {
  queryString: z.string().optional().describe('Optional query string to filter reviews'),
};

export const ProductReviewsCountZodSchema = z.object(ProductReviewsCountSchema);

export type ProductReviewsCountParams = z.infer<typeof ProductReviewsCountZodSchema>;

export async function productReviewsCountHandler(context: Context, params: ProductReviewsCountParams) {
  const { modules } = context;

  try {
    const count = await modules.products.reviews.count(params);

    return {
      content: [
        {
          type: 'text' as const,
          text: count.toString(),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error fetching review count: ${(error as Error).message}`,
        },
      ],
    };
  }
}
