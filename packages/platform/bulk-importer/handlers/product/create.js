import { Products } from 'meteor/unchained:core-products';
import upsertVariations from './upsertVariations';
import upsertMedia from './upsertMedia';

export default async function createProduct(payload, { logger, authorId }) {
  const { specification, media, variations, _id } = payload;
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
      ...productData,
      _id,
      warehousing,
      supply,
      proxy,
      authorId,
    });

    await Promise.all(
      Object.entries(content).map(async ([locale, localizedData]) => {
        return product.upsertLocalizedText(locale, {
          ...localizedData,
          authorId,
        });
      })
    );
  }

  await upsertMedia({ media: media || [], productId: _id, authorId });

  await upsertVariations({
    variations: variations || [],
    productId: _id,
    authorId,
  });
}
