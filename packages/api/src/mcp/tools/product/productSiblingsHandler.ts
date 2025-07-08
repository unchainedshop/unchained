import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';

import { z } from 'zod';
import { getNormalizedProductDetails } from '../../utils/getNormalizedProductDetails.js';

export const ProductSiblingsSchema = {
  productId: z.string().describe('Product ID to get siblings of'),
  assortmentId: z.string().optional().describe('Assortment ID to filter siblings (optional)'),
  limit: z.number().int().min(1).max(100).default(10).describe('Number of siblings to return'),
  offset: z.number().int().min(0).default(0).describe('Pagination offset'),
  includeInactive: z
    .boolean()
    .optional()
    .default(false)
    .describe('Whether to include inactive sibling products'),
};

export const ProductSiblingsZodSchema = z
  .object(ProductSiblingsSchema)
  .describe(
    'Retrieve sibling products of a given product, optionally filtered by assortment ID, with support for pagination and inclusion of inactive products.',
  );

export type ProductSiblingsParams = z.infer<typeof ProductSiblingsZodSchema>;

export async function productSiblingsHandler(context: Context, params: ProductSiblingsParams) {
  const { modules, userId } = context;
  const { productId, assortmentId, limit, offset, includeInactive } = params;

  try {
    log('handler productSiblingsHandler', { userId, params });

    const assortmentIds = assortmentId
      ? [assortmentId]
      : await modules.assortments.products.findAssortmentIds({ productId });

    if (!assortmentIds.length)
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({ products: [] }),
          },
        ],
      };

    const productIds = await modules.assortments.products.findSiblings({
      productId,
      assortmentIds,
    });

    const products = await modules.products.findProducts({
      productIds,
      includeDrafts: includeInactive,
      limit,
      offset,
    });

    const normalizedProducts = (
      await Promise.allSettled(products.map(({ _id }) => getNormalizedProductDetails(_id, context)))
    ).flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ products: normalizedProducts }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error retrieving product siblings: ${(error as Error).message}`,
        },
      ],
    };
  }
}
