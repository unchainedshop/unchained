import { UnchainedCore } from '@unchainedshop/types/core.js';
import upsertVariations from './upsertVariations.js';
import upsertMedia from './upsertMedia.js';
import transformSpecificationToProductStructure from './transformSpecificationToProductStructure.js';

export default async function createProduct(
  payload: any,
  { logger, createShouldUpsertIfIDExists },
  unchainedAPI: UnchainedCore,
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
    });
  } catch (e) {
    if (!createShouldUpsertIfIDExists) throw e;

    logger.debug('entity already exists, falling back to update', specification);
    await modules.products.update(_id, {
      ...productData,
    });
  }

  if (!(await modules.products.productExists({ productId: _id }))) {
    throw new Error(`Can't create product ${_id}, fields missing?`);
  }

  logger.debug('create localized content for product', specification.content);
  await modules.products.texts.updateTexts(
    _id,
    Object.entries(specification.content).map(([locale, localizedData]: [string, any]) => {
      return {
        locale,
        ...localizedData,
      };
    }),
  );

  logger.debug('create product variations', variations);
  await upsertVariations(
    {
      variations: variations || [],
      productId: _id,
    },
    unchainedAPI,
  );

  logger.debug('create product media', media);
  await upsertMedia({ media: media || [], productId: _id }, unchainedAPI);

  return {
    entity: 'PRODUCT',
    operation: 'create',
    _id,
    success: true,
  };
}
