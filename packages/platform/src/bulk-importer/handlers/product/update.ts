import { UnchainedCore } from '@unchainedshop/types/core.js';
import upsertVariations from './upsertVariations.js';
import upsertMedia from './upsertMedia.js';
import transformSpecificationToProductStructure from './transformSpecificationToProductStructure.js';

export default async function createProduct(payload: any, { logger }, unchainedAPI: UnchainedCore) {
  const { modules } = unchainedAPI;
  const { specification, media, variations, _id } = payload;

  if (!(await modules.products.productExists({ productId: _id }))) {
    throw new Error(`Can't update non-existing product ${_id}`);
  }

  if (specification) {
    const productData = transformSpecificationToProductStructure(specification);
    logger.debug('update product object', productData);
    await modules.products.update(_id, {
      ...productData,
    });

    if (specification.content) {
      logger.debug('replace localized content for product', specification.content);
      await modules.products.texts.updateTexts(
        _id,
        Object.entries(specification.content).map(([locale, localizedData]: [string, any]) => {
          return {
            locale,
            ...localizedData,
          };
        }),
      );
    }
  }

  if (variations) {
    logger.debug('replace variations', variations);
    await upsertVariations(
      {
        variations: variations || [],
        productId: _id,
      },
      unchainedAPI,
    );
  }

  if (media) {
    logger.debug('replace product media', media);
    await upsertMedia({ media, productId: _id }, unchainedAPI);
  }

  return {
    entity: 'PRODUCT',
    operation: 'update',
    _id,
    success: true,
  };
}
