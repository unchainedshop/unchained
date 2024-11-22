import { log } from '@unchainedshop/logger';
import { AssortmentFilterNotFoundError, InvalidIdError } from '../../../errors.js';
import { Context } from '../../../context.js';

export default async function removeAssortmentFilter(
  root: never,
  { assortmentFilterId }: { assortmentFilterId: string },
  { modules, userId }: Context,
) {
  log(`mutation removeAssortmentFilter ${assortmentFilterId}`, {
    userId,
  });
  if (!assortmentFilterId) throw new InvalidIdError({ assortmentFilterId });

  const assortmentFilter = await modules.assortments.filters.findFilter({
    assortmentFilterId,
  });

  if (!assortmentFilter) throw new AssortmentFilterNotFoundError({ assortmentFilterId });

  await modules.assortments.filters.delete(assortmentFilterId);

  return assortmentFilter;
}
