import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { z } from 'zod';
import { z } from 'zod';

export const ProductMediaSchema = {
  productId: z.string().min(1).describe('ID of the product to retrieve media for'),
  limit: z.number().int().min(1).max(100).default(10).describe('Number of media items to return'),
  offset: z.number().int().min(0).default(0).describe('Pagination offset'),
  tags: z.array(z.string().min(1)).optional().describe('Filter media by lowercase tags'),
};

export const ProductMediaZodSchema = z
  .object(ProductMediaSchema)
  .describe(
    'Retrieve media assets associated with a product, optionally filtered by tags and paginated.',
  );

export type ProductMediaParams = z.infer<typeof ProductMediaZodSchema>;

export async function productMediaHandler(context: Context, params: ProductMediaParams) {
  const { productId, limit, offset, tags } = params;
  const { modules, loaders, userId } = context;

  try {
    log('handler productMediaHandler', { userId, params });
    let media = [];
    if (offset || tags) {
      media = await modules.products.media.findProductMedias({
        productId,
        ...params,
      });
    }
    media = (await loaders.productMediasLoader.load({ productId })).slice(offset, offset + limit);
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ media }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error retrieving product media: ${(error as Error).message}`,
        },
      ],
    };
  }
}
