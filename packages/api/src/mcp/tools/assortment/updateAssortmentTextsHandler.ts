import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { AssortmentNotFoundError } from '../../../errors.js';

export const AssortmentAssortmentTextInputSchema = z.object({
  locale: z
    .string()
    .min(2)
    .describe(
      `Locale ISO code for the language of the text (e.g., "en-US", "de-CH").
If not provided, fallback to the shop's defaultLanguageIsoCode.
If provided, it must be a valid language configured in the shop.`,
    ),
  slug: z
    .string()
    .optional()
    .describe('Optional URL-safe identifier for the assortment (e.g., "summer-sale").'),
  title: z.string().optional().describe('Optional title for the assortment in this locale.'),
  subtitle: z.string().optional().describe('Optional subtitle providing extra context.'),
  description: z.string().optional().describe('Optional long-form description of the assortment.'),
});

export const UpdateAssortmentTextsSchema = {
  assortmentId: z.string().min(1).describe('ID of the assortment to update'),
  texts: z.array(AssortmentAssortmentTextInputSchema).min(1).describe('Localized metadata to update'),
};

export const UpdateAssortmentTextsZodSchema = z.object(UpdateAssortmentTextsSchema);

export type UpdateAssortmentTextsParams = z.infer<typeof UpdateAssortmentTextsZodSchema>;

export async function updateAssortmentTextsHandler(
  context: Context,
  params: UpdateAssortmentTextsParams,
) {
  const { assortmentId, texts } = params;
  const { modules, userId } = context;

  try {
    log('handler updateAssortmentTextsHandler', { userId, params });

    if (!(await modules.assortments.assortmentExists({ assortmentId })))
      throw new AssortmentNotFoundError({ assortmentId });

    const assortmentTexts = await modules.assortments.texts.updateTexts(assortmentId, texts as any);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ texts: assortmentTexts }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error updating assortment texts: ${(error as Error).message}`,
        },
      ],
    };
  }
}
