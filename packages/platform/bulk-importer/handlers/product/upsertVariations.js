import { ProductVariations } from 'meteor/unchained:core-products';

const upsert = async ({ _id, ...entityData }) => {
  try {
    return ProductVariations.createVariation({ _id, ...entityData });
  } catch (e) {
    ProductVariations.update({ _id }, { $set: entityData });
    return ProductVariations.findOne({ _id });
  }
};

export default async ({ variations, authorId, productId }) => {
  const variationObjects = await Promise.all(
    variations.map(async ({ content, options, ...variationsRest }) => {
      const variation = await upsert({
        authorId,
        ...variationsRest,
        options: options.map((option) => option.value),
        productId,
      });
      await Promise.all(
        options.map(async ({ content: optionContent, value: optionValue }) => {
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
  ProductVariations.remove({
    productId,
    _id: { $nin: variationObjects.map((obj) => obj._id) },
  });
};
