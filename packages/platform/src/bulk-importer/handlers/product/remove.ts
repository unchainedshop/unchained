import { UnchainedCore } from '@unchainedshop/types/core';

export default async function removeProduct(payload: any, { logger }, unchainedAPI: UnchainedCore) {
  const { services } = unchainedAPI;
  const { _id } = payload;
  logger.debug(`remove product ${_id}`);

  await services.products.removeProduct({ productId: _id }, unchainedAPI);

  return {
    entity: 'PRODUCT',
    operation: 'remove',
    _id,
    success: true,
  };
}
