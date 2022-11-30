import { Context } from '@unchainedshop/types/api';
import upsertVariations from './upsertVariations';
import upsertMedia from './upsertMedia';
import upsertProductContent from './upsertProductContent';
import transformSpecificationToProductStructure from './transformSpecificationToProductStructure';

export default async function createProduct(
  payload: any,
  { logger, authorId, createShouldUpsertIfIDExists },
  unchainedAPI: Context,
) {
  const { modules } = unchainedAPI;
  const { specification, media, variations, _id } = payload;

  if (!specification) throw new Error(`Specification is required when creating new product ${_id}`);

  if (!specification.content) throw new Error(`Content is required when creating new product ${_id}`);

  const productData = transformSpecificationToProductStructure(specification);
  logger.debug('create product object', productData);
  try {
    await modules.products.create({
      ...productData,
      _id,
      authorId,
    });
  } catch (e) {
    if (!createShouldUpsertIfIDExists) throw e;

    logger.debug('entity already exists, falling back to update', specification);
    await modules.products.update(_id, {
      ...productData,
      authorId,
    });
  }

  if (!(await modules.products.productExists({ productId: _id }))) {
    throw new Error(`Can't create product ${_id}, fields missing?`);
  }

  logger.debug('create localized content for product', specification.content);
  await upsertProductContent(
    {
      content: specification.content,
      productId: _id,
    },
    unchainedAPI,
  );

  logger.debug('create product variations', variations);
  await upsertVariations(
    {
      variations: variations || [],
      productId: _id,
      authorId,
    },
    unchainedAPI,
  );

  logger.debug('create product media', media);
  await upsertMedia({ media: media || [], productId: _id, authorId }, unchainedAPI);

  return {
    entity: 'PRODUCT',
    operation: 'create',
    _id,
    success: true,
  };
}
