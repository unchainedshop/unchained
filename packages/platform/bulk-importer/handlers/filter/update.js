import { Filters } from 'meteor/unchained:core-filters';
import upsertFilterContent from './upsertFilterContent';
import upsertFilterOptionContent from './upsertFilterOptionContent';

export default async function updateFilter(payload, { logger, authorId }) {
  const { specification, _id } = payload;

  if (!specification)
    throw new Error('Specification is required when creating a new filter');

  logger.debug('update filter object', specification);
  const { content, options, ...filterData } = specification;
  const filter = await Filters.updateFilter({
    ...filterData,
    filterId: _id,
    options: options?.map((option) => option.value) || [],
    authorId,
  });

  if (content) {
    logger.debug('replace localized content for filter', content);
    await upsertFilterContent({ content, filter }, { authorId, logger });
  }

  if (options) {
    logger.debug('replace localized content for filter options', content);
    await upsertFilterOptionContent({ options, filter }, { authorId, logger });
  }
}
