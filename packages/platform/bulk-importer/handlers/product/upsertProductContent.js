import { Products } from 'meteor/unchained:core-products';

export default async ({ productId, content, authorId }) => {
  const product = await Products.findProduct({ productId });
  if (!product)
    throw new Error(
      `Can't update content of non-existing product ${productId}`
    );

  await Promise.all(
    Object.entries(content).map(async ([locale, localizedData]) => {
      return product.upsertLocalizedText(locale, {
        ...localizedData,
        authorId,
      });
    })
  );
};
