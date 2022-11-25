import { Context } from '@unchainedshop/types/api';

export default async function removeFilter(payload: any, { logger }, unchainedAPI: Context) {
  const { modules } = unchainedAPI;
  const { _id } = payload;
  logger.debug('remove filter');
  await modules.assortments.filters.deleteMany({ filterId: _id });
  await modules.filters.delete(_id);

  return {
    entity: 'FILTER',
    operation: 'remove',
    _id,
    success: true,
  };
}
