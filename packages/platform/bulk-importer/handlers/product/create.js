import { Products } from 'meteor/unchained:core-products';

export default async function createProduct(payload, { logger, authorId }) {
  const { specification, _id } = payload;
  logger.verbose('prepare: create product', payload);

  if (specification) {
    const {
      variationResolvers: assignments,
      content,
      warehousing: warehousingEmbeddedSupply,
      ...productData
    } = specification;

    const { dimensions: supply, ...warehousing } =
      warehousingEmbeddedSupply || {};

    const proxy = assignments ? { assignments } : undefined;

    const product = await Products.createProduct({
      _id,
      ...productData,
      warehousing,
      supply,
      proxy,
      authorId,
    });

    await Promise.all(
      Object.entries(content).map(([locale, localizedData]) => {
        return product.upsertLocalizedText(locale, {
          ...localizedData,
          authorId,
        });
      }),
    );
  }

  if (media) {
    // Replace Media Links
  }

  if (variations) {
    // Replace variations
  }
}
