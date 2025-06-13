import { z } from 'zod';
import { Context } from '../../context.js';
import normalizeMediaUrl from './normalizeMediaUrl.js';

export const UpdateProductTextsSchema = {
  productId: z.string().min(1).describe('ID of the product to update texts for'),
  texts: z
    .array(
      z.object({
        locale: z
          .string()
          .min(2)
          .describe(
            'Locale code like "en", "de" always use locales registered in the system languages, if explicitly provided check if it exists',
          ),
        slug: z.string().optional().describe('URL slug'),
        title: z.string().optional().describe('Product title'),
        subtitle: z.string().optional().describe('Product subtitle'),
        description: z.string().optional().describe('Markdown description'),
        vendor: z.string().optional().describe('Vendor name'),
        brand: z.string().optional().describe('Brand name'),
        labels: z.array(z.string()).optional().describe('Labels or tags'),
      }),
    )
    .nonempty()
    .describe('Localized product text entries'),
};

export const UpdateProductTextsZodSchema = z.object(UpdateProductTextsSchema);

export type UpdateProductTextsParams = z.infer<typeof UpdateProductTextsZodSchema>;

export async function updateProductTextsHandler(context: Context, params: UpdateProductTextsParams) {
  const { productId, texts } = params;
  const { modules } = context;

  try {
    await modules.products.texts.updateTexts(productId, texts as any[]);

    const updatedProduct = await modules.products.findProduct({ productId });
    const updatedTexts = await context.loaders.productTextLoader.load({
      productId,
      locale: context.locale,
    });

    const productMedias = await context.modules.products.media.findProductMedias({
      productId,
    });
    const media = await normalizeMediaUrl(productMedias, context);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            product: { ...updatedProduct, texts: updatedTexts, media },
          }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error updating product texts: ${(error as Error).message}`,
        },
      ],
    };
  }
}
