import { Context } from '@unchainedshop/types/api';
import upsertFilterContent from './upsertFilterContent';
import upsertFilterOptionContent from './upsertFilterOptionContent';

export default async function createFilter(
  payload: any,
  { logger, authorId, createShouldUpsertIfIDExists },
  unchainedAPI: Context,
) {
  const { modules } = unchainedAPI;
  const { specification, _id } = payload;

  if (!specification) throw new Error(`Specification is required when creating new filter ${_id}`);

  const { content, options, ...filterData } = specification;

  if (!content) throw new Error(`Localizable content is required when creating new filter${_id}`);

  logger.debug('create filter object', specification);
  let filter;
  try {
    filter = await unchainedAPI.modules.filters.create(
      {
        ...filterData,
        _id,
        options: options?.map((option) => option.value) || [],
        authorId,
      },
      unchainedAPI,
    );
  } catch (e) {
    if (!createShouldUpsertIfIDExists) throw e;

    logger.debug('entity already exists, falling back to update', specification);
    filter = await modules.filters.update(
      _id,
      {
        ...filterData,
        options: options?.map((option) => option.value) || [],
        authorId,
      },
      unchainedAPI,
    );
  }

  logger.debug('create localized content for filter', content);
  await upsertFilterContent({ content, filter }, { authorId }, unchainedAPI);

  logger.debug('create localized content for filter options', content);
  await upsertFilterOptionContent({ options, filter }, { authorId }, unchainedAPI);

  return {
    entity: 'FILTER',
    operation: 'create',
    _id,
    success: true,
  };
}
