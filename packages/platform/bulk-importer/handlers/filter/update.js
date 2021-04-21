import { Filters } from 'meteor/unchained:core-filters';

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

    await Promise.all(
      Object.entries(content).map(async ([locale, localizedData]) => {
        return filter.upsertLocalizedText(locale, {
          ...localizedData,
          authorId,
        });
      })
    );
  }

  if (options) {
    logger.debug('replace localized content for filter options', content);
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
  }
}
