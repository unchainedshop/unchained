import { Context } from '@unchainedshop/types/api';
import { ProductVariation, ProductVariationText } from '@unchainedshop/types/products.variations';

const upsert = async (productVariation: ProductVariation, unchainedAPI: Context) => {
  const { modules, userId } = unchainedAPI;
  try {
    const newVariation = await modules.products.variations.create(productVariation, userId);
    return newVariation;
  } catch (e) {
    return modules.products.variations.update(productVariation._id, productVariation);
  }
};

export default async function upsertVariations(
  { variations, authorId, productId },
  unchainedAPI: Context,
) {
  const { modules, userId } = unchainedAPI;

  const upsertedProductVariationIds = await Promise.all(
    variations.map(async ({ content, options, ...variationsRest }) => {
      const variation = await upsert(
        {
          authorId,
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
              async ([locale, { authorId: tAuthorId, ...localizedData }]: [
                string,
                ProductVariationText,
              ]) => {
                return modules.products.variations.texts.upsertLocalizedText(
                  {
                    productVariationId: variation._id,
                    productVariationOptionValue: optionValue,
                  },
                  locale,
                  localizedData,
                  tAuthorId || authorId || userId,
                );
              },
            ),
          );
        }),
      );
      await Promise.all(
        Object.entries(content).map(
          async ([locale, { authorId: tAuthorId, ...localizedData }]: [
            string,
            ProductVariationText,
          ]) => {
            return modules.products.variations.texts.upsertLocalizedText(
              {
                productVariationId: variation._id,
              },
              locale,
              localizedData,
              tAuthorId || authorId || userId,
            );
          },
        ),
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
