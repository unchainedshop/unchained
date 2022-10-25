import { Context } from '@unchainedshop/types/api';
import upsertFilterContent from './upsertFilterContent';
import upsertFilterOptionContent from './upsertFilterOptionContent';

export default async function updateFilter(
  payload: any,
  { authorId, logger }: { authorId: string; logger: any },
  unchainedAPI: Context,
) {
  const { modules } = unchainedAPI;
  const { specification, _id } = payload;

  if (!(await modules.filters.filterExists({ filterId: _id }))) {
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
        authorId,
      },
      unchainedAPI,
      { skipInvalidation: true },
      unchainedAPI.userId,
    );
  }

  if (content) {
    logger.debug('replace localized content for filter', content);
    await upsertFilterContent({ content, filterId: _id, authorId }, unchainedAPI);
  }

  if (options) {
    logger.debug('replace localized content for filter options', content);
    await upsertFilterOptionContent({ options, filterId: _id }, unchainedAPI);
  }

  return {
    entity: 'FILTER',
    operation: 'update',
    _id,
    success: true,
  };
}
