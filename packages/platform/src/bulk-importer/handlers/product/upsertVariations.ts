import { Context } from '@unchainedshop/types/api';
import { ProductVariation, ProductVariationText } from '@unchainedshop/types/products.variations';

const upsert = async (productVariation: ProductVariation, unchainedAPI: Context) => {
  const { modules, userId } = unchainedAPI;
  try {
    return modules.products.variations.create(productVariation, userId);
  } catch (e) {
    return modules.products.variations.update(productVariation._id, productVariation);
  }
};

export default async function upsertVariations(
  { variations, authorId, productId },
  unchainedAPI: Context,
) {
  const { modules, userId } = unchainedAPI;

  const productVariationObjects = await Promise.all(
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
      return variation;
    }),
  );
  await modules.products.variations.deleteVariations({
    productId,
    excludedProductVariationIds: productVariationObjects.map((obj) => obj._id),
  });
}
