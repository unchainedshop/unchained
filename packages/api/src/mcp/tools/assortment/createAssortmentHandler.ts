import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { getNormalizedAssortmentDetails } from '../../utils/getNormalizedAssortmentDetails.js';

export const AssortmentTextInputSchema = z.object({
  locale: z
    .string()
    .min(1)
    .describe(
      'locale iso code like "en-US", "de-CH" use default defaultLanguageIsoCode in shop info if not explicitly provided. if language is explicitly provided check if it exists',
    ),
  slug: z.string().optional().describe('Optional slug for URL structure'),
  title: z.string().optional().describe('Title of the assortment'),
  subtitle: z.string().optional().describe('Optional subtitle'),
  description: z.string().optional().describe('Optional description'),
});

export const CreateAssortmentInputSchema = z.object({
  isRoot: z.boolean().optional().describe('Whether this assortment is a root assortment'),
  tags: z
    .array(z.string().min(1).toLowerCase())
    .optional()
    .describe('List of lowercase tags associated with the assortment'),
});

export const CreateAssortmentSchema = {
  assortment: CreateAssortmentInputSchema,
  texts: z.array(AssortmentTextInputSchema).optional(),
};
export const CreateAssortmentZodSchema = z.object(CreateAssortmentSchema);

export type CreateAssortmentParams = z.infer<typeof CreateAssortmentZodSchema>;

export async function createAssortmentHandler(context: Context, params: CreateAssortmentParams) {
  const { modules, userId } = context;
  const { assortment, texts } = params;

  try {
    log('handler createAssortmentHandler', { userId, params });

    const newAssortment = await modules.assortments.create(assortment as any);

    if (texts) {
      await modules.assortments.texts.updateTexts(newAssortment._id, texts as any);
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            assortment: await getNormalizedAssortmentDetails(
              { assortmentId: newAssortment._id },
              context,
            ),
          }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error creating assortment: ${(error as Error).message}`,
        },
      ],
    };
  }
}
