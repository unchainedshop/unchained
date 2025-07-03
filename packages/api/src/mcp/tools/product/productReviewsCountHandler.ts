import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';

export const ProductReviewsCountSchema = {
  queryString: z.string().optional().describe('Optional query string to filter reviews'),
};

export const ProductReviewsCountZodSchema = z.object(ProductReviewsCountSchema);

export type ProductReviewsCountParams = z.infer<typeof ProductReviewsCountZodSchema>;

export async function productReviewsCountHandler(context: Context, params: ProductReviewsCountParams) {
  const { modules, userId } = context;

  try {
    log('handler productReviewsCountHandler', { userId, params });
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
