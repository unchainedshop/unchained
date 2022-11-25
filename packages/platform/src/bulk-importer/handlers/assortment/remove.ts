import { Context } from '@unchainedshop/types/api';

export default async function removeAssortment(payload, { logger }, unchainedAPI: Context) {
  const { modules } = unchainedAPI;
  const { _id } = payload;
  logger.debug('remove assortment');
  await modules.assortments.delete(_id, { skipInvalidation: true });

  return {
    entity: 'ASSORTMENT',
    operation: 'remove',
    _id,
    success: true,
  };
}
