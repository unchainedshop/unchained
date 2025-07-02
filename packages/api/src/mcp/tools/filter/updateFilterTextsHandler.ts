import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { FilterNotFoundError } from '../../../errors.js';
import { getNormalizedFilterDetails } from '../../utils/getNormalizedFilterDetails.js';

export const FilterUpdateTextInputSchema = z.object({
  locale: z.string().min(1),
  title: z.string().optional(),
  subtitle: z.string().optional(),
});

export const UpdateFilterTextsSchema = {
  filterId: z.string().min(1).describe('ID of the filter to update texts for'),
  filterOptionValue: z.string().optional().describe('Optional filter option to localize'),
  texts: z.array(FilterUpdateTextInputSchema).min(1).describe('Localized texts to create or update'),
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
