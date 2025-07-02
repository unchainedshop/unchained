import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { FilterNotFoundError } from '../../../errors.js';
import { getNormalizedFilterDetails } from '../../utils/getNormalizedFilterDetails.js';
import { FilterDirector } from '@unchainedshop/core';

export const FilterOptionTextInputSchema = z.object({
  locale: z
    .string()
    .min(1)
    .describe(
      'locale iso code like "en-US", "de-CH" use default defaultLanguageIsoCode in shop info if not explicitly provided. if language is explicitly provided check if it exists',
    ),
  title: z.string().optional(),
  subtitle: z.string().optional(),
});

export const CreateFilterOptionSchema = {
  filterId: z.string().min(1).describe('ID of the filter to add the option to'),
  option: z.string().min(1).describe('Value of the new filter option'),
  texts: z.array(FilterOptionTextInputSchema).optional().describe('Localized titles and subtitles'),
};

export const CreateFilterOptionZodSchema = z.object(CreateFilterOptionSchema);

export type CreateFilterOptionParams = z.infer<typeof CreateFilterOptionZodSchema>;

export async function createFilterOptionHandler(context: Context, params: CreateFilterOptionParams) {
  const { filterId, option, texts = [] } = params;
  const { modules, userId } = context;

  try {
    log('handler createFilterOption', { userId, filterId, option, texts });

    const filter = await getNormalizedFilterDetails(filterId, context);
    if (!filter) throw new FilterNotFoundError({ filterId });

    const newOptions = await modules.filters.createFilterOption(filterId, { value: option });
    await FilterDirector.invalidateProductIdCache(newOptions, context);

    if (texts) {
      await modules.filters.texts.updateTexts({ filterId, filterOptionValue: option }, texts);
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ filter }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error creating filter option: ${(error as Error).message}`,
        },
      ],
    };
  }
}
