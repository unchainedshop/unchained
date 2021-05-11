import { Filters } from 'meteor/unchained:core-filters';
import upsertFilterContent from './upsertFilterContent';
import upsertFilterOptionContent from './upsertFilterOptionContent';

export default async function createFilter(
  payload,
  { logger, authorId, createShouldUpsertIfIDExists }
) {
  const { specification, _id } = payload;

  if (!specification)
    throw new Error(
      `Specification is required when creating new filter ${_id}`
    );

  const { content, options, ...filterData } = specification;

  if (!content)
    throw new Error(
      `Localizable content is required when creating new filter${_id}`
    );

  logger.debug('create filter object', specification);
  let filter;
  try {
    filter = await Filters.createFilter({
      ...filterData,
      _id,
      options: options?.map((option) => option.value) || [],
      authorId,
    });
  } catch (e) {
    if (!createShouldUpsertIfIDExists) throw e;

    logger.debug(
      'entity already exists, falling back to update',
      specification
    );
    filter = await Filters.updateFilter({
      ...filterData,
      filterId: _id,
      options: options?.map((option) => option.value) || [],
      authorId,
    });
  }

  logger.debug('create localized content for filter', content);
  await upsertFilterContent({ content, filter }, { authorId, logger });

  logger.debug('create localized content for filter options', content);
  await upsertFilterOptionContent({ options, filter }, { authorId, logger });
}
