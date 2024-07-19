import { UnchainedCore } from '@unchainedshop/types/core.js';
import createFilter from './create.js';

export default async function updateFilter(
  payload: any,
  {
    logger,
    updateShouldUpsertIfIDNotExists,
    createShouldUpsertIfIDExists,
  }: { logger: any; updateShouldUpsertIfIDNotExists: boolean; createShouldUpsertIfIDExists: boolean },
  unchainedAPI: UnchainedCore,
) {
  const { modules } = unchainedAPI;
  const { specification, _id } = payload;

  if (!(await modules.filters.filterExists({ filterId: _id }))) {
    if (updateShouldUpsertIfIDNotExists) {
      return createFilter(payload, { logger, createShouldUpsertIfIDExists }, unchainedAPI);
    }
    throw new Error(`Can't update non-existing filter ${_id}`);
  }

  const { content, options, ...filterData } = specification;

  if (specification) {
    logger.debug('update filter object', specification);
    await modules.filters.update(
      _id,
      {
        ...filterData,
        options: options?.map((option) => option.value) || [],
      },
      unchainedAPI,
      { skipInvalidation: true },
    );
  }

  if (content) {
    logger.debug('replace localized content for filter', content);
    await modules.filters.texts.updateTexts(
      { filterId: _id },
      Object.entries(content).map(([locale, localizedData]: [string, any]) => {
        return {
          locale,
          ...localizedData,
        };
      }),
    );
  }

  if (options) {
    logger.debug('replace localized content for filter options', content);
    await Promise.all(
      options.map(async ({ content: optionContent, value: optionValue }) =>
        modules.filters.texts.updateTexts(
          { filterId: _id, filterOptionValue: optionValue },
          Object.entries(optionContent).map(([locale, localizedData]: [string, any]) => {
            return {
              locale,
              ...localizedData,
            };
          }),
        ),
      ),
    );
  }

  return {
    entity: 'FILTER',
    operation: 'update',
    _id,
    success: true,
  };
}
