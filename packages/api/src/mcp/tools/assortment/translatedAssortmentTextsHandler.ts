import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';

export const TranslatedAssortmentTextsSchema = {
  assortmentId: z.string().min(1).describe('ID of the assortment to retrieve texts for'),
};

export const TranslatedAssortmentTextsZodSchema = z.object(TranslatedAssortmentTextsSchema);

export type TranslatedAssortmentTextsParams = z.infer<typeof TranslatedAssortmentTextsZodSchema>;

export async function translatedAssortmentTextsHandler(
  context: Context,
  params: TranslatedAssortmentTextsParams,
) {
  const { assortmentId } = params;
  const { modules, userId } = context;

  try {
    log('handler translatedAssortmentTextsHandler', { userId, params });

    const texts = await modules.assortments.texts.findTexts({ assortmentId });

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
          text: `Error retrieving assortment texts: ${(error as Error).message}`,
        },
      ],
    };
  }
}
