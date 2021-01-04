import { Products } from 'meteor/unchained:core-products';
import upsertVariations from './upsertVariations';
import upsertMedia from './upsertMedia';
import upsertProductContent from './upsertProductContent';

import transformSpecificationToProductStructure from './transformSpecificationToProductStructure';

export default async function createProduct(payload, { logger, authorId }) {
  const { specification, media, variations, _id } = payload;

  if (!specification)
    throw new Error('Specification is required when creating a new product');

  const productData = transformSpecificationToProductStructure(specification);
  logger.debug('create product object', productData);
  await Products.createProduct({
    ...productData,
    _id,
    authorId,
  });

  if (!specification.content)
    throw new Error('Product content is required when creating a new product');

  logger.debug('create localized content for product', specification.content);
  await upsertProductContent({
    content: specification.content,
    productId: _id,
    authorId,
  });

  logger.debug('create product media', media);
  await upsertMedia({ media: media || [], productId: _id, authorId });

  logger.debug('create product variations', variations);
  await upsertVariations({
    variations: variations || [],
    productId: _id,
    authorId,
  });
}
