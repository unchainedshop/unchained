import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { AssortmentNotFoundError, AssortmentMediaNotFoundError } from '../../../errors.js';

const TextTypeEnum = z.enum(['ASSORTMENT', 'MEDIA'], {
  description:
    'Type of text management - ASSORTMENT for assortment texts, MEDIA for assortment media texts',
});

const TextActionEnum = z.enum(['UPDATE', 'GET'], {
  description: 'Action to perform - UPDATE to modify texts, GET to retrieve existing texts',
});

const AssortmentTextInputSchema = z.object({
  locale: z
    .string()
    .min(2)
    .describe('Locale ISO code (e.g., "en-US", "de-CH") - uses shop default if not provided'),
  slug: z.string().optional().describe('URL-safe identifier for the assortment'),
  title: z.string().optional().describe('Title for the assortment in this locale'),
  subtitle: z.string().optional().describe('Subtitle providing extra context'),
  description: z.string().optional().describe('Long-form description of the assortment'),
});

const AssortmentMediaTextInputSchema = z.object({
  locale: z
    .string()
    .min(2)
    .describe('Locale ISO code (e.g., "en-US", "de-CH") - uses shop default if not provided'),
  title: z.string().optional().describe('Title in the given locale'),
  subtitle: z.string().optional().describe('Subtitle in the given locale'),
});

export const AssortmentTextsSchema = {
  action: TextActionEnum.describe('Action to perform on texts'),
  textType: TextTypeEnum.describe('Type of text entity to manage'),

  assortmentId: z
    .string()
    .optional()
    .describe('ID of the assortment (required for ASSORTMENT operations)'),
  assortmentTexts: z
    .array(AssortmentTextInputSchema)
    .optional()
    .describe('Localized assortment texts (for UPDATE ASSORTMENT)'),

  assortmentMediaId: z
    .string()
    .optional()
    .describe('ID of the assortment media (required for MEDIA operations)'),
  mediaTexts: z
    .array(AssortmentMediaTextInputSchema)
    .optional()
    .describe('Localized media texts (for UPDATE MEDIA)'),
};

export const AssortmentTextsZodSchema = z.object(AssortmentTextsSchema);
export type AssortmentTextsParams = z.infer<typeof AssortmentTextsZodSchema>;

export async function assortmentTexts(context: Context, params: AssortmentTextsParams) {
  const { action, textType, assortmentId, assortmentTexts, assortmentMediaId, mediaTexts } = params;
  const { modules, userId } = context;

  try {
    log('handler assortmentTexts', { userId, action, textType, params });

    switch (textType) {
      case 'ASSORTMENT': {
        if (!assortmentId) {
          throw new Error('assortmentId is required for ASSORTMENT operations');
        }

        if (action === 'UPDATE') {
          if (!assortmentTexts || assortmentTexts.length === 0) {
            throw new Error('assortmentTexts array is required for UPDATE ASSORTMENT operations');
          }

          if (!(await modules.assortments.assortmentExists({ assortmentId }))) {
            throw new AssortmentNotFoundError({ assortmentId });
          }

          const updatedTexts = await modules.assortments.texts.updateTexts(
            assortmentId,
            assortmentTexts as any,
          );

          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify({
                  texts: updatedTexts,
                  assortmentId,
                }),
              },
            ],
          };
        } else {
          const texts = await modules.assortments.texts.findTexts({ assortmentId });

          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify({
                  texts,
                  assortmentId,
                }),
              },
            ],
          };
        }
      }

      case 'MEDIA': {
        if (!assortmentMediaId) {
          throw new Error('assortmentMediaId is required for MEDIA operations');
        }

        const assortmentMedia = await modules.assortments.media.findAssortmentMedia({
          assortmentMediaId,
        });

        if (!assortmentMedia) {
          throw new AssortmentMediaNotFoundError({ assortmentMediaId });
        }

        if (action === 'UPDATE') {
          if (!mediaTexts || mediaTexts.length === 0) {
            throw new Error('mediaTexts array is required for UPDATE MEDIA operations');
          }

          const updatedMediaTexts = await modules.assortments.media.texts.updateMediaTexts(
            assortmentMediaId,
            mediaTexts as any,
          );

          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify({
                  texts: updatedMediaTexts,
                  assortmentMediaId,
                  assortmentId: assortmentMedia.assortmentId,
                }),
              },
            ],
          };
        } else {
          const texts = await modules.assortments.media.texts.findMediaTexts({
            assortmentMediaId,
          });

          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify({
                  texts,
                  assortmentMediaId,
                  assortmentId: assortmentMedia.assortmentId,
                }),
              },
            ],
          };
        }
      }

      default:
        throw new Error(`Unknown text type: ${textType}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error ${action.toLowerCase()}ing ${textType.toLowerCase()} texts: ${(error as Error).message}`,
        },
      ],
    };
  }
}
