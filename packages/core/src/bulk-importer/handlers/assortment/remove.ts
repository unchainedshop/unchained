import { z } from 'zod';
import { Modules } from '../../../modules.js';

export const AssortmentRemovePayloadSchema = z.object({
  _id: z.string(),
});

export default async function removeAssortment(
  payload: z.infer<typeof AssortmentRemovePayloadSchema>,
  { logger },
  unchainedAPI: { modules: Modules },
) {
  const { modules } = unchainedAPI;
  const { _id } = payload;
  logger.debug('remove assortment');
  const deletedAssortment = await modules.assortments.delete(_id, { skipInvalidation: true });

  return {
    entity: 'ASSORTMENT',
    operation: 'remove',
    _id,
    success: Boolean(deletedAssortment),
  };
}
