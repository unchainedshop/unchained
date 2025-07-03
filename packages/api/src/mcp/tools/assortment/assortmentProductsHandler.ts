import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { getNormalizedProductDetails } from '../../utils/getNormalizedProductDetails.js';

export const AssortmentProductsSchema = {
  assortmentId: z
    .string()
    .min(1)
    .optional()
    .describe('ID of the assortment to fetch products for (optional).'),
  includeInactive: z
    .boolean()
    .optional()
    .default(false)
    .describe('Whether to include inactive products in the assortment.'),
};

export const AssortmentProductsZodSchema = z.object(AssortmentProductsSchema);

export type AssortmentProductsParams = z.infer<typeof AssortmentProductsZodSchema>;

export async function assortmentProductsHandler(context: Context, params: AssortmentProductsParams) {
  const { userId, modules } = context;
  const { assortmentId } = params;

  try {
    log('handler assortmentProductsHandler', { userId, params });
    const assortmentProducts = await modules.assortments.products.findAssortmentProducts(
      {
        assortmentId,
      },
      {
        sort: { sortKey: 1 },
      },
    );

    const normalizedAssortmentProducts = await Promise.all(
      assortmentProducts.map(async ({ productId }) => getNormalizedProductDetails(productId, context)),
    );

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ products: normalizedAssortmentProducts }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error getting assortment children: ${(error as Error).message}`,
        },
      ],
    };
  }
}
