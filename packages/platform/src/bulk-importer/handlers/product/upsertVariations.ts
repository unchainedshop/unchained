import { UnchainedCore } from '@unchainedshop/types/core';
import { ProductVariation, ProductVariationText } from '@unchainedshop/types/products.variations';

const upsert = async (productVariation: ProductVariation, unchainedAPI: UnchainedCore) => {
  const { modules } = unchainedAPI;
  try {
    const newVariation = await modules.products.variations.create(productVariation);
    return newVariation;
  } catch (e) {
    return modules.products.variations.update(productVariation._id, productVariation);
  }
};

export default async function upsertVariations({ variations, productId }, unchainedAPI: UnchainedCore) {
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
          await Promise.all(
            Object.entries(optionContent).map(
              async ([locale, localizedData]: [string, ProductVariationText]) => {
                return modules.products.variations.texts.upsertLocalizedText(
                  {
                    productVariationId: variation._id,
                    productVariationOptionValue: optionValue,
                  },
                  locale,
                  localizedData,
                );
              },
            ),
          );
        }),
      );
      await Promise.all(
        Object.entries(content).map(async ([locale, localizedData]: [string, ProductVariationText]) => {
          return modules.products.variations.texts.upsertLocalizedText(
            {
              productVariationId: variation._id,
            },
            locale,
            localizedData,
          );
        }),
      );
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
