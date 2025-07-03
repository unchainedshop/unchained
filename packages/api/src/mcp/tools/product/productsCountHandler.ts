import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';

export const ProductsCountSchema = {
  tags: z.array(z.string().min(1)).optional().describe('Filter products by tags'),
  slugs: z.array(z.string().min(1)).optional().describe('Filter products by slugs'),
  includeDrafts: z.boolean().default(false).describe('Include draft (unpublished) products'),
  queryString: z.string().min(1).optional().describe('Text query to filter products'),
};

export const ProductsCountZodSchema = z.object(ProductsCountSchema);
export type ProductsCountParams = z.infer<typeof ProductsCountZodSchema>;

export async function productsCountHandler(context: Context, params: ProductsCountParams) {
  const { modules, userId } = context;

  try {
    log('handler productsCountHandler', { userId, params });
    const count = await modules.products.count(params);

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
          text: `Error counting products: ${(error as Error).message}`,
        },
      ],
    };
  }
}
