import { z } from 'zod';
import { Context } from '../../context.js';
import { ProductMediaNotFoundError } from '../../errors.js';

export const UpdateProductMediaTextsSchema = {
    productMediaId: z.string().min(1).describe('ID of the media asset to update'),
    texts: z
        .array(
            z.object({
                locale: z.string().min(2).describe('Locale of the text, e.g. "en", "fr", etc.'),
                title: z.string().optional().describe('Title in the given locale'),
                subtitle: z.string().optional().describe('Subtitle in the given locale'),
            }),
        )
        .min(1)
        .describe('List of localized texts to update'),
};

export const UpdateProductMediaTextsZodSchema = z.object(UpdateProductMediaTextsSchema);

export type UpdateProductMediaTextsParams = z.infer<typeof UpdateProductMediaTextsZodSchema>;

export async function updateProductMediaTextsHandler(
    context: Context,
    params: UpdateProductMediaTextsParams,
) {
    const { productMediaId, texts } = params;
    const { modules } = context;

    try {
        const productMedia = await modules.products.media.findProductMedia({
            productMediaId,
        });
        if (!productMedia) throw new ProductMediaNotFoundError({ productMediaId });

        const updatedTexts = await modules.products.media.texts.updateMediaTexts(productMediaId, texts);

        return {
            content: [
                {
                    type: 'text' as const,
                    text: JSON.stringify({ texts: updatedTexts }),
                },
            ],
        };
    } catch (error) {
        return {
            content: [
                {
                    type: 'text' as const,
                    text: `Error updating product media texts: ${(error as Error).message}`,
                },
            ],
        };
    }
}
