import { Context } from '@unchainedshop/types/api';

export default async function removeProduct(payload: any, { logger }, unchainedAPI: Context) {
  const { services } = unchainedAPI;
  const { _id } = payload;
  logger.debug('remove product');

  await services.products.removeProduct({ productId: _id }, unchainedAPI);

  return {
    entity: 'PRODUCT',
    operation: 'remove',
    _id,
    success: true,
  };
}
