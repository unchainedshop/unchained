import { z } from 'zod';
import { createLogger } from '@unchainedshop/logger';
import type { ProductVariation } from '@unchainedshop/core-products';
import type { Modules } from '../../../modules.ts';

const logger = createLogger('unchained:bulk-importer');

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
  productVariation: {
    type: string;
    productId: string;
    key: string;
    options?: string[];
    _id?: string;
  },
  unchainedAPI: { modules: Modules },
): Promise<ProductVariation> => {
  const { modules } = unchainedAPI;

  // Check if the variation already exists
  if (productVariation._id) {
    const existing = await modules.products.variations.findProductVariation({
      productVariationId: productVariation._id,
    });
    if (existing) {
      const updated = await modules.products.variations.update(productVariation._id, productVariation);
      if (!updated) {
        throw new Error(`Failed to update product variation ${productVariation._id}`);
      }
      logger.debug(`Updated product variation ${productVariation._id}`);
      return updated as ProductVariation;
    }
  }

  const newVariation = await modules.products.variations.create(productVariation);
  if (!newVariation) {
    throw new Error(`Failed to create product variation`);
  }
  logger.debug(`Created product variation ${newVariation._id}`);
  return newVariation as ProductVariation;
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
