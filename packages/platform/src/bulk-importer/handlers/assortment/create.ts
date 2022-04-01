import { Context } from '@unchainedshop/types/api';
import upsertAssortmentChildren from './upsertAssortmentChildren';
import upsertAssortmentContent from './upsertAssortmentContent';
import upsertAssortmentFilters from './upsertAssortmentFilters';
import upsertAssortmentProducts from './upsertAssortmentProducts';
import upsertMedia from './upsertMedia';

export default async function createAssortment(
  payload: any,
  { logger, authorId, createShouldUpsertIfIDExists },
  unchainedAPI: Context,
) {
  const { modules, userId } = unchainedAPI;
  const { media, specification, products, children, filters, _id } = payload;

  if (!specification) throw new Error(`Specification is required when creating new assortment ${_id}`);

  if (!specification.content)
    throw new Error(`Assortment content is required when creating new assortment${_id}`);

  logger.debug('create assortment object', specification);
  try {
    await modules.assortments.create({ ...specification, _id, authorId }, userId);
  } catch (e) {
    if (!createShouldUpsertIfIDExists) throw e;
    logger.debug('entity already exists, falling back to update', specification);
    await modules.assortments.update(
      _id,
      {
        ...specification,
        authorId,
      },
      userId,
    );
  }

  logger.debug('create localized content for assortment', specification.content);
  await upsertAssortmentContent(
    {
      content: specification.content,
      assortmentId: _id,
    },
    unchainedAPI,
  );

  logger.debug('create product products', products);
  await upsertAssortmentProducts(
    {
      products: products || [],
      assortmentId: _id,
      authorId,
    },
    unchainedAPI,
  );

  logger.debug('create assortment children', products);
  await upsertAssortmentChildren(
    {
      children: children || [],
      assortmentId: _id,
      authorId,
    },
    unchainedAPI,
  );

  logger.debug('create assortment filters', products);
  await upsertAssortmentFilters(
    {
      filters: filters || [],
      assortmentId: _id,
      authorId,
    },
    unchainedAPI,
  );

  logger.debug('create assortment media', media);
  await upsertMedia({ media: media || [], assortmentId: _id, authorId }, unchainedAPI);

  return {
    entity: 'ASSORTMENT',
    operation: 'create',
    _id,
    success: true,
  };
}
