import { Assortments } from 'meteor/unchained:core-assortments';
import upsertMedia from './upsertMedia';
import upsertAssortmentContent from './upsertAssortmentContent';
import upsertAssortmentProducts from './upsertAssortmentProducts';
import upsertAssortmentChildren from './upsertAssortmentChildren';
import upsertAssortmentFilters from './upsertAssortmentFilters';

export default async function createAssortment(
  payload,
  { logger, authorId, createShouldUpsertIfIDExists }
) {
  const { media, specification, products, children, filters, _id } = payload;

  if (!specification)
    throw new Error(
      `Specification is required when creating new assortment ${_id}`
    );

  if (!specification.content)
    throw new Error(
      `Assortment content is required when creating new assortment${_id}`
    );

  logger.debug('create assortment object', specification);
  try {
    await Assortments.createAssortment({
      ...specification,
      _id,
      authorId,
    });
  } catch (e) {
    if (!createShouldUpsertIfIDExists) throw e;
    logger.debug(
      'entity already exists, falling back to update',
      specification
    );
    await Assortments.updateAssortment({
      ...specification,
      assortmentId: _id,
      authorId,
    });
  }

  logger.debug(
    'create localized content for assortment',
    specification.content
  );
  await upsertAssortmentContent({
    content: specification.content,
    assortmentId: _id,
    authorId,
  });

  logger.debug('create product products', products);
  await upsertAssortmentProducts({
    products: products || [],
    assortmentId: _id,
    authorId,
  });

  logger.debug('create assortment children', products);
  await upsertAssortmentChildren({
    children: children || [],
    assortmentId: _id,
    authorId,
  });

  logger.debug('create assortment filters', products);
  await upsertAssortmentFilters({
    filters: filters || [],
    assortmentId: _id,
    authorId,
  });

  logger.debug('create assortment media', media);
  await upsertMedia({ media: media || [], assortmentId: _id, authorId });
}
