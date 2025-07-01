import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { AssortmentNotFoundError } from '../../../errors.js';
import { getNormalizedAssortmentDetails } from '../../utils/getNormalizedAssortmentDetails.js';

export const RemoveAssortmentSchema = {
  assortmentId: z.string().min(1).describe('ID of the assortment to remove'),
};

export const RemoveAssortmentZodSchema = z.object(RemoveAssortmentSchema);
export type RemoveAssortmentParams = z.infer<typeof RemoveAssortmentZodSchema>;

export async function removeAssortmentHandler(context: Context, params: RemoveAssortmentParams) {
  const { modules, userId } = context;
  const { assortmentId } = params;

  try {
    log('handler removeAssortment', { userId, assortmentId });

    const assortment = await getNormalizedAssortmentDetails({ assortmentId }, context);
    if (!assortment) throw new AssortmentNotFoundError({ assortmentId });

    await modules.assortments.delete(assortmentId);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ assortment }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error removing assortment: ${(error as Error).message}`,
        },
      ],
    };
  }
}
