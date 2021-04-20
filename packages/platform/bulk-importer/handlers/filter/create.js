import { Filters } from 'meteor/unchained:core-filters';

export default async function createFilter(payload, { logger, authorId }) {
  const { specification, _id } = payload;

  if (!specification)
    throw new Error('Specification is required when creating a new filter');

  logger.debug('create filter object', specification);
  const { content, options, ...filterData } = specification;
  let filter;
  try {
    filter = await Filters.createFilter({
      ...filterData,
      _id,
      options: options.map((option) => option.value),
      authorId,
    });
  } catch (e) {
    logger.debug(
      'entity already exists, falling back to update',
      specification
    );
    filter = await Filters.updateFilter({
      ...filterData,
      filterId: _id,
      options: options.map((option) => option.value),
      authorId,
    });
  }

  if (!content)
    throw new Error(
      'Localizable content is required when creating a new filter'
    );

  logger.debug('create localized content for filter', specification.content);
  await Promise.all(
    Object.entries(content).map(async ([locale, localizedData]) => {
      return filter.upsertLocalizedText(locale, {
        ...localizedData,
        authorId,
      });
    })
  );

  logger.debug(
    'create localized content for filter options',
    specification.content
  );
  await Promise.all(
    options.map(async ({ content: optionContent, value: optionValue }) => {
      await Promise.all(
        Object.entries(optionContent).map(async ([locale, localizedData]) => {
          return filter.upsertLocalizedText(locale, {
            ...localizedData,
            filterOptionValue: optionValue,
            authorId,
          });
        })
      );
    })
  );

  if (!specification.content)
    throw new Error('Product content is required when creating a new filter');
}
