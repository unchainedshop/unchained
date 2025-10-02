import { z } from 'zod';
import { Modules } from '../../../modules.js';
import { Services } from '../../../services/index.js';

export const ProductRemovePayloadSchema = z.object({
  _id: z.string(),
});
export default async function removeProduct(
  payload: z.infer<typeof ProductRemovePayloadSchema>,
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

removeProduct.payloadSchema = ProductRemovePayloadSchema;
