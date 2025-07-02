import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { AssortmentMediaNotFoundError } from '../../../errors.js';

export const AssortmentMediaTextInputSchema = z.object({
  locale: z
    .string()
    .min(2)
    .describe(
      'locale iso code like "en-US", "de-CH" use default defaultLanguageIsoCode in shop info if not explicitly provided. if language is explicitly provided check if it exists',
    ),
  title: z.string().optional().describe('Title in the given locale'),
  subtitle: z.string().optional().describe('Subtitle in the given locale'),
});

export const UpdateAssortmentMediaTextsSchema = {
  assortmentMediaId: z.string().min(1).describe('ID of the assortment media to update'),
  texts: z.array(AssortmentMediaTextInputSchema).min(1).describe('Localized text values to update'),
};

export const UpdateAssortmentMediaTextsZodSchema = z.object(UpdateAssortmentMediaTextsSchema);

export type UpdateAssortmentMediaTextsParams = z.infer<typeof UpdateAssortmentMediaTextsZodSchema>;

export async function updateAssortmentMediaTextsHandler(
  context: Context,
  params: UpdateAssortmentMediaTextsParams,
) {
  const { assortmentMediaId, texts } = params;
  const { modules, userId } = context;

  try {
    log('handler updateAssortmentMediaTexts', { userId, assortmentMediaId, texts });

    const assortmentMedia = await modules.assortments.media.findAssortmentMedia({
      assortmentMediaId,
    });

    if (!assortmentMedia) throw new AssortmentMediaNotFoundError({ assortmentMediaId });

    const assortmentMediaTexts = await modules.assortments.media.texts.updateMediaTexts(
      assortmentMediaId,
      texts,
    );
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ assortmentMediaTexts }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error updating assortment media texts: ${(error as Error).message}`,
        },
      ],
    };
  }
}
