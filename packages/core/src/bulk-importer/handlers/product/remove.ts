import { Modules } from '../../../modules.js';
import { Services } from '../../../services/index.js';

export default async function removeProduct(
  payload: any,
  { logger },
  unchainedAPI: { modules: Modules; services: Services },
) {
  const { services } = unchainedAPI;
  const { _id } = payload;
  logger.debug(`remove product ${_id}`);

  await services.products.removeProduct({ productId: _id });

  return {
    entity: 'PRODUCT',
    operation: 'remove',
    _id,
    success: true,
  };
}
