import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { getNormalizedAssortmentDetails } from '../../utils/getNormalizedAssortmentDetails.js';

export const AssortmentSchema = {
  assortmentId: z.string().min(1).optional().describe('ID of the assortment to fetch'),
  slug: z.string().min(1).optional().describe('Slug of the assortment to fetch'),
};

export const AssortmentZodSchema = z
  .object(AssortmentSchema)
  .refine((data) => !!data.assortmentId || !!data.slug, {
    message: 'Either assortmentId or slug must be provided.',
  });

export type AssortmentParams = z.infer<typeof AssortmentZodSchema>;

export async function assortmentHandler(context: Context, params: AssortmentParams) {
  const { userId } = context;
  const { assortmentId, slug } = params;

  try {
    log('handler assortmentHandler', { userId, params });

    const assortment = await getNormalizedAssortmentDetails(
      {
        assortmentId,
        slug,
      },
      context,
    );

    if (!assortment) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Assortment not found  with ${assortmentId ? `ID: ${assortmentId}` : `slug: ${slug}`}`,
          },
        ],
      };
    }

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
          text: `Error getting assortment: ${(error as Error).message}`,
        },
      ],
    };
  }
}
