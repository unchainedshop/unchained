import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';
import { AssortmentFilterNotFoundError, InvalidIdError } from '../../../errors';

export default async function removeAssortmentFilter(
  root: Root,
  { assortmentFilterId }: { assortmentFilterId: string },
  { modules, userId }: Context
) {
  log(`mutation removeAssortmentFilter ${assortmentFilterId}`, {
    modules,
    userId,
  });
  if (!assortmentFilterId) throw new InvalidIdError({ assortmentFilterId });

  const assortmentFilter = await modules.assortments.filters.findFilter({
    assortmentFilterId,
  });

  if (!assortmentFilter)
    throw new AssortmentFilterNotFoundError({ assortmentFilterId });

  await modules.assortments.filters.delete(assortmentFilterId, userId);

  return assortmentFilter;
}
