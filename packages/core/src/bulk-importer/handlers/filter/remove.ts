import { z } from 'zod';
import { Modules } from '../../../modules.js';

export const FilterRemovePayloadSchema = z.object({
  _id: z.string(),
});

export default async function removeFilter(
  payload: z.infer<typeof FilterRemovePayloadSchema>,
  { logger },
  unchainedAPI: { modules: Modules },
) {
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
