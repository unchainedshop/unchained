import { ProductVariation } from '@unchainedshop/core-products';
import { Modules } from '../../../modules.js';

const upsert = async (productVariation: ProductVariation, unchainedAPI: { modules: Modules }) => {
  const { modules } = unchainedAPI;
  try {
    const newVariation = await modules.products.variations.create(productVariation);
    return newVariation;
  } catch {
    return modules.products.variations.update(productVariation._id, productVariation);
  }
};

export default async function upsertVariations(
  { variations, productId },
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
