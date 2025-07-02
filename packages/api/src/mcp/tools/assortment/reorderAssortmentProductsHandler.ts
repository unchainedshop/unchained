import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';

export const ReorderAssortmentProductInputSchema = z.object({
  assortmentProductId: z.string().min(1),
  sortKey: z.number(),
});

export const ReorderAssortmentProductsSchema = {
  sortKeys: z
    .array(ReorderAssortmentProductInputSchema)
    .min(1)
    .describe('New sort order for assortment products'),
};

export const ReorderAssortmentProductsZodSchema = z.object(ReorderAssortmentProductsSchema);

export type ReorderAssortmentProductsParams = z.infer<typeof ReorderAssortmentProductsZodSchema>;

export async function reorderAssortmentProductsHandler(
  context: Context,
  params: ReorderAssortmentProductsParams,
) {
  const { sortKeys } = params;
  const { modules, userId } = context;

  try {
    log('handler reorderAssortmentProducts', { userId, sortKeys });

    await modules.assortments.products.updateManualOrder({
      sortKeys,
    } as any);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ success: true }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error reordering assortment products: ${(error as Error).message}`,
        },
      ],
    };
  }
}
