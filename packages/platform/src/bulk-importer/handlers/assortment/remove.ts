import { UnchainedCore } from '@unchainedshop/types/core.js';

export default async function removeAssortment(payload, { logger }, unchainedAPI: UnchainedCore) {
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
