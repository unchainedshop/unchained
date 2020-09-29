import { Assortments } from 'meteor/unchained:core-assortments';
import upsertAssortmentContent from './upsertAssortmentContent';
import upsertAssortmentProducts from './upsertAssortmentProducts';
import upsertAssortmentChildren from './upsertAssortmentChildren';
import upsertAssortmentFilters from './upsertAssortmentFilters';

export default async function createAssortment(payload, { logger, authorId }) {
  const { specification, products, children, filters, _id } = payload;

  if (!specification)
    throw new Error('Specification is required when creating a new assortment');

  logger.debug('create assortment object', specification);
  const assortment = await Assortments.createAssortment({
    ...specification,
    _id,
    authorId,
  });

  if (!specification.content)
    throw new Error(
      'Assortment content is required when creating a new assortment'
    );

  logger.debug(
    'create localized content for assortment',
    specification.content
  );
  await upsertAssortmentContent({
    content: specification.content,
    assortment,
    authorId,
  });

  logger.debug('create product links', products);
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
}
