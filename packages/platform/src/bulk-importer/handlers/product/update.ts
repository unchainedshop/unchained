import { Context } from '@unchainedshop/types/api';
import upsertVariations from './upsertVariations';
import upsertMedia from './upsertMedia';
import upsertProductContent from './upsertProductContent';
import transformSpecificationToProductStructure from './transformSpecificationToProductStructure';

export default async function createProduct(payload: any, { logger, authorId }, unchainedAPI: Context) {
  const { modules, userId } = unchainedAPI;
  const { specification, media, variations, _id } = payload;

  if (!(await modules.products.productExists({ productId: _id }))) {
    throw new Error(`Can't update non-existing product ${_id}`);
  }

  if (specification) {
    const productData = transformSpecificationToProductStructure(specification);
    logger.debug('update product object', productData);
    await modules.products.update(
      _id,
      {
        ...productData,
        authorId,
      },
      userId,
    );

    if (specification.content) {
      logger.debug('replace localized content for product', specification.content);
      await upsertProductContent(
        {
          content: specification.content,
          productId: _id,
          authorId,
        },
        unchainedAPI,
      );
    }
  }

  if (variations) {
    logger.debug('replace variations', variations);
    await upsertVariations(
      {
        variations: variations || [],
        productId: _id,
        authorId,
      },
      unchainedAPI,
    );
  }

  if (media) {
    logger.debug('replace product media', media);
    await upsertMedia({ media, productId: _id, authorId }, unchainedAPI);
  }

  return {
    entity: 'PRODUCT',
    operation: 'update',
    _id,
    success: true,
  };
}
