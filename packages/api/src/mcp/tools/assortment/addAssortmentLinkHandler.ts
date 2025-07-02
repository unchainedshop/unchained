import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { getNormalizedAssortmentDetails } from '../../utils/getNormalizedAssortmentDetails.js';
import { AssortmentNotFoundError } from '../../../errors.js';

export const AddAssortmentLinkSchema = {
  parentAssortmentId: z.string().min(1).describe('ID of the parent assortment'),
  childAssortmentId: z.string().min(1).describe('ID of the child assortment'),
  tags: z.array(z.string().min(1)).default([]).describe('Tags for the link'),
};

export const AddAssortmentLinkZodSchema = z.object(AddAssortmentLinkSchema);

export type AddAssortmentLinkParams = z.infer<typeof AddAssortmentLinkZodSchema>;

export async function addAssortmentLinkHandler(context: Context, params: AddAssortmentLinkParams) {
  const { parentAssortmentId, childAssortmentId, tags } = params;
  const { modules, userId } = context;

  try {
    log('handler addAssortmentLink', {
      userId,
      parentAssortmentId,
      childAssortmentId,
      tags,
    });
    const parent = await getNormalizedAssortmentDetails({ assortmentId: parentAssortmentId }, context);
    if (!parent)
      throw new AssortmentNotFoundError({
        assortmentId: parentAssortmentId,
      });
    const child = await getNormalizedAssortmentDetails({ assortmentId: childAssortmentId }, context);
    if (!child)
      throw new AssortmentNotFoundError({
        assortmentId: childAssortmentId,
      });

    const result = await modules.assortments.links.create({
      parentAssortmentId,
      childAssortmentId,
      tags,
    } as any);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ assortmentLink: { ...result, parent, child } }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error adding assortment link: ${(error as Error).message}`,
        },
      ],
    };
  }
}
