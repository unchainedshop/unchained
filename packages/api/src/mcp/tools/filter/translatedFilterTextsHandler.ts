import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { FilterNotFoundError } from '../../../errors.js';

export const TranslatedFilterTextsSchema = {
  filterId: z
    .string()
    .min(1)
    .describe('Unique identifier of the filter to retrieve translated texts for'),
  filterOptionValue: z
    .string()
    .optional()
    .describe('Optional: specific filter option value to fetch translated texts for'),
};

export const TranslatedFilterTextsZodSchema = z.object(TranslatedFilterTextsSchema);

export type TranslatedFilterTextsParams = z.infer<typeof TranslatedFilterTextsZodSchema>;

export async function translatedFilterTextsHandler(
  context: Context,
  params: TranslatedFilterTextsParams,
) {
  const { filterId, filterOptionValue } = params;
  const { modules, userId } = context;

  try {
    log('handler translatedFilterTextsHandler', { userId, params });

    const filter = await modules.filters.findFilter({ filterId });
    if (!filter) {
      throw new FilterNotFoundError({ filterId });
    }

    const texts = await modules.filters.texts.findTexts({
      filterId,
      filterOptionValue: filterOptionValue || null,
    });

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ texts }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error retrieving filter texts: ${(error as Error).message}`,
        },
      ],
    };
  }
}
