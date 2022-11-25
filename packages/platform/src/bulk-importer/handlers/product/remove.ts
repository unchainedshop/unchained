import { Context } from '@unchainedshop/types/api';

export default async function removeProduct(payload: any, { logger }, unchainedAPI: Context) {
  const { services, userId } = unchainedAPI;
  const { _id } = payload;
  logger.debug(`remove product ${_id}`);

  await services.products.removeProduct({ productId: _id, userId }, unchainedAPI);

  return {
    entity: 'PRODUCT',
    operation: 'remove',
    _id,
    success: true,
  };
}
