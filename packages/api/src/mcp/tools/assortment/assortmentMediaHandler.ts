import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { z } from 'zod';

export const AssortmentMediaSchema = {
  assortmentId: z.string().min(1).describe('ID of the Assortment to retrieve media for'),
  limit: z.number().int().min(1).max(100).default(10).describe('Number of media items to return'),
  offset: z.number().int().min(0).default(0).describe('Pagination offset'),
  tags: z.array(z.string().min(1)).optional().describe('Filter media by lowercase tags'),
};

export const AssortmentMediaZodSchema = z
  .object(AssortmentMediaSchema)
  .describe(
    'Retrieve media assets associated with a assortment, optionally filtered by tags and paginated.',
  );

export type assortmentMediaParams = z.infer<typeof AssortmentMediaZodSchema>;

export async function assortmentMediaHandler(context: Context, params: assortmentMediaParams) {
  const { assortmentId, limit, offset, tags } = params;
  const { modules, loaders, userId } = context;

  try {
    log('handler assortmentMediaHandler', { userId, params });
    let media = [];
    if (offset || tags) {
      media = await modules.assortments.media.findAssortmentMedias({
        assortmentId,
        ...params,
      });
    } else {
      media = (await loaders.assortmentMediasLoader.load({ assortmentId })).slice(
        offset,
        offset + limit,
      );
    }
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
          text: `Error retrieving assortment media: ${(error as Error).message}`,
        },
      ],
    };
  }
}
