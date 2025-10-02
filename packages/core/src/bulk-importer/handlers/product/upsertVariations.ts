import { z } from 'zod';
import { ProductVariation } from '@unchainedshop/core-products';
import { Modules } from '../../../modules.js';

const ProductVariationOptionSchema = z.object({
  value: z.string(),
  content: z
    .record(
      z.string(), // locale
      z.object({
        title: z.string().optional(),
        subtitle: z.string().optional(),
      }),
    )
    .optional(),
});

export const ProductVariationSchema = z.object({
  _id: z.string().optional(),
  key: z.string(),
  type: z.string(),
  options: z.array(ProductVariationOptionSchema),
  content: z
    .record(
      z.string(), // locale
      z.object({
        title: z.string().optional(),
        subtitle: z.string().optional(),
      }),
    )
    .optional(),
});

const upsert = async (
  productVariation: Omit<ProductVariation, '_id' | 'created'> &
    Pick<Partial<ProductVariation>, '_id' | 'created'>,
  unchainedAPI: { modules: Modules },
) => {
  const { modules } = unchainedAPI;
  try {
    const newVariation = (await modules.products.variations.create(
      productVariation,
    )) as ProductVariation;
    return newVariation;
  } catch {
    return (await modules.products.variations.update(
      productVariation._id!,
      productVariation,
    )) as ProductVariation;
  }
};

export default async function upsertVariations(
  { variations, productId }: { variations: z.infer<typeof ProductVariationSchema>[]; productId: string },
  unchainedAPI: { modules: Modules },
) {
  const { modules } = unchainedAPI;

  const upsertedProductVariationIds = await Promise.all(
    variations.map(async ({ content, options, ...variationsRest }) => {
      const variation = await upsert(
        {
          ...variationsRest,
          options: options.map((option) => option.value),
          productId,
        },
        unchainedAPI,
      );

      await Promise.all(
        options.map(async ({ content: optionContent, value: optionValue }) => {
          if (optionContent) {
            await modules.products.variations.texts.updateVariationTexts(
              variation._id,
              Object.entries(optionContent).map(([locale, localizedData]: [string, any]) => {
                return {
                  locale,
                  ...localizedData,
                };
              }),
              optionValue,
            );
          }
        }),
      );
      if (content) {
        await modules.products.variations.texts.updateVariationTexts(
          variation._id,
          Object.entries(content).map(([locale, localizedData]: [string, any]) => {
            return {
              locale,
              ...localizedData,
            };
          }),
        );
      }
      return variation._id;
    }),
  );
  const allVariations = await modules.products.variations.findProductVariations({
    productId,
  });
  await Promise.all(
    allVariations.map(async (variation) => {
      if (!upsertedProductVariationIds.includes(variation._id)) {
        await modules.products.variations.delete(variation._id);
      }
    }),
  );
}
