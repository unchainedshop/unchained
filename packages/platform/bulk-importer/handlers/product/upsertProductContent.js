import { Products } from 'meteor/unchained:core-products';

export default async ({ productId, content, authorId }) => {
  const product = Products.findProduct({ productId });
  await Promise.all(
    Object.entries(content).map(async ([locale, localizedData]) => {
      return product.upsertLocalizedText(locale, {
        ...localizedData,
        authorId,
      });
    })
  );
};
