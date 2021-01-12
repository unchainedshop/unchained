import { Products } from 'meteor/unchained:core-products';
import upsertVariations from './upsertVariations';
import upsertMedia from './upsertMedia';
import upsertProductContent from './upsertProductContent';
import transformSpecificationToProductStructure from './transformSpecificationToProductStructure';

export default async function createProduct(payload, { logger, authorId }) {
  const { specification, media, variations, _id } = payload;

  if (specification) {
    const productData = transformSpecificationToProductStructure(specification);
    logger.debug('update product object', productData);
    await Products.updateProduct({
      ...productData,
      productId: _id,
      authorId,
    });
    if (specification.content) {
      logger.debug(
        'replace localized content for product',
        specification.content
      );
      await upsertProductContent({
        content: specification.content,
        productId: _id,
        authorId,
      });
    }
  }

  if (media) {
    logger.debug('replace product media', media);
    await upsertMedia({ media, productId: _id, authorId });
  }

  if (variations) {
    logger.debug('replace variations', variations);
    await upsertVariations({
      variations: variations || [],
      productId: _id,
      authorId,
    });
  }
}
