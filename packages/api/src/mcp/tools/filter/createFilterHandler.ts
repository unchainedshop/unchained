import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { FilterDirector } from '@unchainedshop/core';
import { getNormalizedFilterDetails } from '../../utils/getNormalizedFilterDetails.js';

export const CreateFilterInputSchema = z.object({
  key: z.string().min(1).describe('Unique key for the filter'),
  type: z.enum(['SWITCH', 'SINGLE_CHOICE', 'MULTI_CHOICE', 'RANGE']).describe('Type of the filter'),
  options: z.array(z.string().min(1)).optional().describe('Selectable options (if applicable)'),
});

export const FilterTextInputSchema = z.object({
  locale: z
    .string()
    .min(1)
    .describe(
      'locale iso code like "en-US", "de-CH" use default defaultLanguageIsoCode in shop info if not explicitly provided. if language is explicitly provided check if it exists',
    ),
  title: z.string().min(1),
  subtitle: z.string().optional(),
});

export const CreateFilterSchema = {
  filter: CreateFilterInputSchema,
  texts: z.array(FilterTextInputSchema).optional(),
};

export const CreateFilterZodSchema = z.object(CreateFilterSchema);

export type CreateFilterParams = z.infer<typeof CreateFilterZodSchema>;

export async function createFilterHandler(context: Context, params: CreateFilterParams) {
  const { filter, texts = [] } = params;
  const { modules, userId } = context;

  try {
    log('handler createFilter', { userId, filter, texts });

    const newFilter = await modules.filters.create(filter as any);

    await FilterDirector.invalidateProductIdCache(newFilter, context);
    if (texts) {
      await modules.filters.texts.updateTexts({ filterId: newFilter._id }, texts);
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ filter: await getNormalizedFilterDetails(newFilter._id, context) }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error creating filter: ${(error as Error).message}`,
        },
      ],
    };
  }
}
