import { ProductVariations } from 'meteor/unchained:core-products';

export default async ({ variations, authorId, productId }) => {
  return Promise.all(
    variations.map(async ({ asset, content, options, ...variationsRest }) => {
      const variation = await ProductVariations.createVariation({
        authorId,
        ...variationsRest,
        options: options.map((option) => option.value),
        productId,
      });
      await Promise.all(
        options.map(async ({ content: optionContent, optionValue }) => {
          await Promise.all(
            Object.entries(optionContent).map(
              async ([locale, localizedData]) => {
                return variation.upsertLocalizedText(locale, {
                  ...localizedData,
                  productVariationOptionValue: optionValue,
                  authorId,
                });
              }
            )
          );
        })
      );
      await Promise.all(
        Object.entries(content).map(async ([locale, localizedData]) => {
          return variation.upsertLocalizedText(locale, {
            ...localizedData,
            authorId,
          });
        })
      );
      return variation;
    })
  );
};
