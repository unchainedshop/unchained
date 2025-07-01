import { z } from 'zod';
import { Context } from '../../../context.js';

export const ProductsCountSchema = {
  tags: z.array(z.string().min(1)).optional(),
  slugs: z.array(z.string().min(1)).optional(),
  includeDrafts: z.boolean().default(false),
  queryString: z.string().min(1).optional(),
};

export const ProductsCountZodSchema = z.object(ProductsCountSchema);
export type ProductsCountParams = z.infer<typeof ProductsCountZodSchema>;

export async function productsCountHandler(context: Context, params: ProductsCountParams) {
  const { modules } = context;

  try {
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
