import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { getNormalizedAssortmentDetails } from '../../utils/getNormalizedAssortmentDetails.js';

const SortDirectionEnum = z.enum(['ASC', 'DESC']);

export const SortOptionInputSchema = z.object({
  key: z.string().min(1).describe('Field to sort by'),
  value: SortDirectionEnum.describe('Sort direction: ASC or DESC'),
});

export const AssortmentsSchema = {
  queryString: z.string().optional().describe('Free-text filter for matching assortments'),
  tags: z
    .array(z.string().min(1).toLowerCase())
    .optional()
    .describe('Filter assortments by lowercase tags'),
  slugs: z.array(z.string().min(1)).optional().describe('Filter assortments by slug(s)'),
  limit: z.number().int().min(1).max(100).default(10).describe('Pagination limit'),
  offset: z.number().int().min(0).default(0).describe('Pagination offset'),
  includeInactive: z
    .boolean()
    .optional()
    .default(false)
    .describe('Whether to include inactive assortments'),
  includeLeaves: z
    .boolean()
    .optional()
    .default(false)
    .describe('Whether to include leaf-level assortments'),
  sort: z.array(SortOptionInputSchema).optional().describe('Sort options (default: sequence ascending)'),
};

export const AssortmentsZodSchema = z.object(AssortmentsSchema);
export type AssortmentsParams = z.infer<typeof AssortmentsZodSchema>;

export async function assortmentsHandler(context: Context, params: AssortmentsParams) {
  const { modules, userId } = context;

  try {
    log('handler assortments', { userId, params });

    const assortments = await modules.assortments.findAssortments(params as any);
    const normalizedAssortments = await Promise.all(
      assortments.map(async ({ _id }) => getNormalizedAssortmentDetails({ assortmentId: _id }, context)),
    );

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ assortments: normalizedAssortments }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error getting assortments: ${(error as Error).message}`,
        },
      ],
    };
  }
}
