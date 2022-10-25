import { Context } from '@unchainedshop/types/api';
import upsertAssortmentContent from './upsertAssortmentContent';
import upsertAssortmentProducts from './upsertAssortmentProducts';
import upsertAssortmentChildren from './upsertAssortmentChildren';
import upsertAssortmentFilters from './upsertAssortmentFilters';
import upsertMedia from './upsertMedia';

export default async function updateAssortment(
  payload: any,
  { logger, authorId },
  unchainedAPI: Context,
) {
  const { modules, userId } = unchainedAPI;
  const { media, specification, products, children, filters, _id } = payload;

  if (!(await modules.assortments.assortmentExists({ assortmentId: _id }))) {
    throw new Error(`Can't update non-existing assortment ${_id}`);
  }

  if (specification) {
    logger.debug('update assortment object', specification);
    await unchainedAPI.modules.assortments.update(_id, { ...specification, authorId }, userId);
    if (specification.content) {
      logger.debug('replace localized content for assortment', specification.content);
      await upsertAssortmentContent(
        {
          content: specification.content,
          assortmentId: _id,
          authorId,
        },
        unchainedAPI,
      );
    }
  }

  if (products) {
    logger.debug('update product products', products);
    await upsertAssortmentProducts(
      {
        products: products || [],
        assortmentId: _id,
        authorId,
      },
      unchainedAPI,
    );
  }

  if (children) {
    logger.debug('update assortment children', children);
    await upsertAssortmentChildren(
      {
        children: children || [],
        assortmentId: _id,
        authorId,
      },
      unchainedAPI,
    );
  }

  if (filters) {
    logger.debug('update assortment filters', filters);
    await upsertAssortmentFilters(
      {
        filters: filters || [],
        assortmentId: _id,
        authorId,
      },
      unchainedAPI,
    );
  }
  if (media) {
    logger.debug('update assortment media', media);
    await upsertMedia({ media: media || [], assortmentId: _id, authorId }, unchainedAPI);
  }

  return {
    entity: 'ASSORTMENT',
    operation: 'update',
    _id,
    success: true,
  };
}
