import { z } from 'zod';
import { Context } from '../../context.js';
import { getNormalizedProductDetails } from '../utils/getNormalizedProductDetails.js';
import { ProductVariationNotFoundError } from '../../errors.js';

const ProductVariationTextInputSchema = z.object({
  locale: z
    .string()
    .min(2)
    .describe(
      'Locale code like "en", "de" always use locales registered in the system languages, if language explicitly provided check if it exists',
    ),
  title: z.string().describe('variation option title in the specified locale'),
  subtitle: z.string().optional().describe('variation option subtitle in the specified locale'),
});

export const CreateProductVariationOptionSchema = {
  productVariationId: z
    .string()
    .min(1)
    .describe('ID of the product variation, it should only be a CONFIGURABLE_PRODUCT type ID'),
  option: z.string().min(1).describe('Name of the new option (e.g., "Red")'),
  texts: z.array(ProductVariationTextInputSchema),
};
export const CreateProductVariationOptionZodSchema = z.object(CreateProductVariationOptionSchema);
export type CreateProductVariationOptionParams = z.infer<typeof CreateProductVariationOptionZodSchema>;

export async function createProductVariationOptionHandler(
  context: Context,
  params: CreateProductVariationOptionParams,
) {
  const { productVariationId, option, texts } = params;
  const { modules } = context;

  try {
    const variation = await modules.products.variations.findProductVariation({
      productVariationId,
    });
    if (!variation) throw new ProductVariationNotFoundError({ productVariationId });

    const newOption = await modules.products.variations.addVariationOption(productVariationId, {
      value: option,
    });

    if (texts) {
      await modules.products.variations.texts.updateVariationTexts(
        productVariationId,
        texts as any,
        option,
      );
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            variation: newOption,
            product: await getNormalizedProductDetails(productVariationId, context),
          }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error creating variation option: ${(error as Error).message}`,
        },
      ],
    };
  }
}
