import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { AssortmentProductNotFoundError } from '../../../errors.js';

export const RemoveAssortmentProductSchema = {
  assortmentProductId: z.string().min(1).describe('ID of the assortment product to remove'),
};

export const RemoveAssortmentProductZodSchema = z.object(RemoveAssortmentProductSchema);

export type RemoveAssortmentProductParams = z.infer<typeof RemoveAssortmentProductZodSchema>;

export async function removeAssortmentProductHandler(
  context: Context,
  params: RemoveAssortmentProductParams,
) {
  const { assortmentProductId } = params;
  const { modules, userId } = context;

  try {
    log(`handler removeAssortmentProductHandler`, { userId, params });

    const assortmentProduct = await modules.assortments.products.findAssortmentProduct({
      assortmentProductId,
    });
    if (!assortmentProduct) throw new AssortmentProductNotFoundError({ assortmentProductId });

    await modules.assortments.products.delete(assortmentProductId);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ assortmentProduct }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error removing assortment product: ${(error as Error).message}`,
        },
      ],
    };
  }
}
