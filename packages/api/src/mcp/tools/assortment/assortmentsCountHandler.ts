import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';

export const AssortmentsCountSchema = {
  tags: z
    .array(z.string().min(1).toLowerCase())
    .optional()
    .describe('Filter assortments by lowercase tags'),
  slugs: z.array(z.string().min(1)).optional().describe('Filter assortments by slug(s)'),
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
  queryString: z.string().optional().describe('Free-text filter for matching assortments'),
};

export const AssortmentsCountZodSchema = z.object(AssortmentsCountSchema);
export type AssortmentsCountParams = z.infer<typeof AssortmentsCountZodSchema>;

export async function assortmentsCountHandler(context: Context, params: AssortmentsCountParams) {
  const { modules, userId } = context;

  try {
    log('handler assortmentsCount', { userId, params });

    const count = await modules.assortments.count(params);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(count),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error counting assortments: ${(error as Error).message}`,
        },
      ],
    };
  }
}
