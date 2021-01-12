import { Assortments } from 'meteor/unchained:core-assortments';
import upsertAssortmentContent from './upsertAssortmentContent';
import upsertAssortmentProducts from './upsertAssortmentProducts';
import upsertAssortmentChildren from './upsertAssortmentChildren';
import upsertAssortmentFilters from './upsertAssortmentFilters';

export default async function updateAssortment(payload, { logger, authorId }) {
  const { specification, products, children, filters, _id } = payload;

  if (specification) {
    logger.debug('update assortment object', specification);
    await Assortments.updateAssortment({
      ...specification,
      assortmentId: _id,
      authorId,
    });

    if (specification.content) {
      logger.debug(
        'replace localized content for assortment',
        specification.content
      );
      await upsertAssortmentContent({
        content: specification.content,
        assortmentId: _id,
        authorId,
      });
    }
  }

  if (products) {
    logger.debug('update product products', products);
    await upsertAssortmentProducts({
      products: products || [],
      assortmentId: _id,
      authorId,
    });
  }

  if (children) {
    logger.debug('update assortment children', children);
    await upsertAssortmentChildren({
      children: children || [],
      assortmentId: _id,
      authorId,
    });
  }

  if (filters) {
    logger.debug('update assortment filters', filters);
    await upsertAssortmentFilters({
      filters: filters || [],
      assortmentId: _id,
      authorId,
    });
  }
}
