import { Context } from '@unchainedshop/types/api';

export default async function removeProduct(payload: any, { logger }, unchainedAPI: Context) {
  const { modules, userId } = unchainedAPI;
  const { _id } = payload;
  logger.debug('remove product');

  // Use service services.product.removeProduct
  await modules.products.delete(_id, userId);

  return {
    entity: 'PRODUCT',
    operation: 'remove',
    _id,
    success: true,
  };
}
