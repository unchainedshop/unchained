import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { FilterNotFoundError } from '../../../errors.js';
import { getNormalizedFilterDetails } from '../../utils/getNormalizedFilterDetails.js';

export const FilterUpdateTextInputSchema = z.object({
  locale: z.string().min(1).describe('Locale ISO code (e.g., "en-US", "de-CH")'),
  title: z.string().optional().describe('Title for the filter or filter option in the specified locale'),
  subtitle: z
    .string()
    .optional()
    .describe('Subtitle for the filter or filter option in the specified locale'),
});

export const UpdateFilterTextsSchema = {
  filterId: z.string().min(1).describe('ID of the filter to update localized texts for'),
  filterOptionValue: z
    .string()
    .optional()
    .describe('Optional value of the filter option to localize (if applicable)'),
  texts: z
    .array(FilterUpdateTextInputSchema)
    .min(1)
    .describe('Array of localized texts to set or update'),
};

export const UpdateFilterTextsZodSchema = z.object(UpdateFilterTextsSchema);

export type UpdateFilterTextsParams = z.infer<typeof UpdateFilterTextsZodSchema>;

// Handler
export async function updateFilterTextsHandler(context: Context, params: UpdateFilterTextsParams) {
  const { filterId, filterOptionValue, texts } = params;
  const { modules, userId } = context;

  try {
    log('handler updateFilterTexts', { userId, filterId, filterOptionValue, texts });

    const filter = await getNormalizedFilterDetails(filterId, context);
    if (!filter) throw new FilterNotFoundError({ filterId });

    const updatedTexts = await modules.filters.texts.updateTexts({ filterId, filterOptionValue }, texts);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ filterTexts: updatedTexts }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error updating filter texts: ${(error as Error).message}`,
        },
      ],
    };
  }
}
