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

  if (!specification) throw new Error('Specification is required when creating a new filter');

  logger.debug('update filter object', specification);
  const { content, options, ...filterData } = specification;
  const filter = await modules.filters.update(
    _id,
    {
      ...filterData,
      options: options?.map((option) => option.value) || [],
      authorId,
    },
    unchainedAPI,
  );

  if (content || options) {
    if (!filter) throw new Error(`Can't update non-existing filter ${_id}`);
  }

  if (content) {
    logger.debug('replace localized content for filter', content);
    await upsertFilterContent({ content, filter }, { authorId }, unchainedAPI);
  }

  if (options) {
    logger.debug('replace localized content for filter options', content);
    await upsertFilterOptionContent({ options, filter }, { authorId }, unchainedAPI);
  }

  return {
    entity: 'FILTER',
    operation: 'update',
    _id,
    success: true,
  };
}
