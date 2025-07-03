import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';

export const TranslatedAssortmentMediaTextsSchema = {
  assortmentMediaId: z.string().min(1).describe('ID of the assortment media to retrieve texts for'),
};

export const TranslatedAssortmentMediaTextsZodSchema = z.object(TranslatedAssortmentMediaTextsSchema);

export type TranslatedAssortmentMediaTextsParams = z.infer<
  typeof TranslatedAssortmentMediaTextsZodSchema
>;

export async function translatedAssortmentMediaTextsHandler(
  context: Context,
  params: TranslatedAssortmentMediaTextsParams,
) {
  const { assortmentMediaId } = params;
  const { modules, userId } = context;

  try {
    log('handler translatedAssortmentMediaTextsHandler', { userId, params });

    const texts = await modules.assortments.media.texts.findMediaTexts({
      assortmentMediaId,
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
          text: `Error retrieving assortment media texts: ${(error as Error).message}`,
        },
      ],
    };
  }
}
