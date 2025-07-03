import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { AssortmentNotFoundError } from '../../../errors.js';

// Input schema for localized text
export const AssortmentAssortmentTextInputSchema = z.object({
  locale: z
    .string()
    .min(2)
    .describe(
      'locale iso code like "en-US", "de-CH" use default defaultLanguageIsoCode in shop info if not explicitly provided. if language is explicitly provided check if it exists',
    ),
  slug: z.string().optional(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  description: z.string().optional(),
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
    log('handler updateAssortmentTexts', { userId, assortmentId, texts });

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
