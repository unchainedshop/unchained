import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { getNormalizedAssortmentDetails } from '../../utils/getNormalizedAssortmentDetails.js';
import { AssortmentNotFoundError } from '../../../errors.js';

export const SetBaseAssortmentSchema = {
  assortmentId: z.string().min(1).describe('ID of the assortment to set as base'),
};

export const SetBaseAssortmentZodSchema = z.object(SetBaseAssortmentSchema);
export type SetBaseAssortmentParams = z.infer<typeof SetBaseAssortmentZodSchema>;

export async function setBaseAssortmentHandler(context: Context, params: SetBaseAssortmentParams) {
  const { modules, userId } = context;
  const { assortmentId } = params;

  try {
    log('handler setBaseAssortmentHandler', { userId, params });

    if (!(await modules.assortments.assortmentExists({ assortmentId })))
      throw new AssortmentNotFoundError({ assortmentId });

    await modules.assortments.setBase(assortmentId);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            assortment: await getNormalizedAssortmentDetails({ assortmentId }, context),
          }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error setting base assortment: ${(error as Error).message}`,
        },
      ],
    };
  }
}
