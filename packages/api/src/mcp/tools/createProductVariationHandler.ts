import { z } from 'zod';
import { Context } from '../../context.js';
import { ProductTypes, ProductVariationType } from '@unchainedshop/core-products';
import { ProductNotFoundError, ProductWrongTypeError } from '../../errors.js';
import normalizeMediaUrl from './normalizeMediaUrl.js';

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
    key: z.string().min(1),
    type: z.enum(productVariationTypeKeys).describe('Product variation types'),
  }),
  texts: z
    .array(
      z.object({
        locale: z.string().min(2),
        title: z.string().optional(),
        subtitle: z.string().optional(),
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
    const updatedProduct = await modules.products.findProduct({ productId });
    const productTexts = await context.loaders.productTextLoader.load({
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
            product: {
              ...updatedProduct,
              texts: productTexts,
              media,
            },
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
