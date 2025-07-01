import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { AssortmentNotFoundError } from '../../../errors.js';
import { getNormalizedAssortmentDetails } from '../../utils/getNormalizedAssortmentDetails.js';

export const UpdateAssortmentInputSchema = z.object({
  isRoot: z.boolean().optional().describe('Whether this assortment is a root assortment'),
  isActive: z.boolean().optional().describe('Whether this assortment is active'),
  sequence: z.number().int().optional().describe('Sorting sequence of the assortment'),
  tags: z
    .array(z.string().min(1).toLowerCase())
    .optional()
    .describe('List of lowercase tags associated with the assortment'),
});

export const UpdateAssortmentSchema = {
  assortmentId: z.string().min(1).describe('ID of the assortment to update'),
  assortment: UpdateAssortmentInputSchema,
};

export const UpdateAssortmentZodSchema = z.object(UpdateAssortmentSchema);
export type UpdateAssortmentParams = z.infer<typeof UpdateAssortmentZodSchema>;

export async function updateAssortmentHandler(context: Context, params: UpdateAssortmentParams) {
  const { modules, userId } = context;
  const { assortmentId, assortment } = params;

  try {
    log('handler updateAssortment', { userId, params });

    if (!(await modules.assortments.assortmentExists({ assortmentId })))
      throw new AssortmentNotFoundError({ assortmentId });

    await modules.assortments.update(assortmentId, assortment as any);

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
          text: `Error updating assortment: ${(error as Error).message}`,
        },
      ],
    };
  }
}
