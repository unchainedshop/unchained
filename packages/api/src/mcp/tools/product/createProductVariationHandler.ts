import { z } from 'zod';
import { Context } from '../../../context.js';
import { ProductTypes, ProductVariationType } from '@unchainedshop/core-products';
import { ProductNotFoundError, ProductWrongTypeError } from '../../../errors.js';
import { getNormalizedProductDetails } from '../../utils/getNormalizedProductDetails.js';

const productVariationTypeKeys = Object.keys(ProductVariationType) as [
  keyof typeof ProductVariationType,
  ...(keyof typeof ProductVariationType)[],
];

export const CreateProductVariationSchema = {
  productId: z
    .string()
    .min(1)
    .describe(
      'Product ID for which to create the variation. it should only be CONFIGURABLE_PRODUCT type product id',
    ),
  variation: z.object({
    key: z
      .string()
      .min(1)
      .describe('unique value that is not already used as key for the products variations vector'),
    type: z.enum(productVariationTypeKeys).describe('Product variation types'),
  }),
  texts: z
    .array(
      z.object({
        locale: z
          .string()
          .min(2)
          .describe(
            'locale iso code like "en-US", "de-CH" use default defaultLanguageIsoCode in shop info if not explicitly provided. if language is explicitly provided check if it exists',
          ),
        title: z.string().describe('variation title'),
        subtitle: z.string().optional().describe('variation additional description'),
      }),
    )
    .optional(),
};

export const CreateProductVariationZodSchema = z.object(CreateProductVariationSchema);
export type CreateProductVariationParams = z.infer<typeof CreateProductVariationZodSchema>;

export async function createProductVariationHandler(
  context: Context,
  params: CreateProductVariationParams,
) {
  const { productId, variation, texts } = params;
  const { modules } = context;

  try {
    const product = await modules.products.findProduct({ productId });
    if (!product) throw new ProductNotFoundError({ productId });

    if (product.type !== ProductTypes.ConfigurableProduct)
      throw new ProductWrongTypeError({
        productId,
        received: product.type,
        required: ProductTypes.ConfigurableProduct,
      });

    const newVariation = await modules.products.variations.create({
      options: [],
      productId,
      ...variation,
    });

    if (texts) {
      await modules.products.variations.texts.updateVariationTexts(newVariation._id, texts as any);
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            product: await getNormalizedProductDetails(productId, context),
          }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error creating product variation: ${(error as Error).message}`,
        },
      ],
    };
  }
}
