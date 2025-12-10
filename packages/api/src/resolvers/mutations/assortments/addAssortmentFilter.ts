import type { AssortmentFilter } from '@unchainedshop/core-assortments';
import { log } from '@unchainedshop/logger';
import { AssortmentNotFoundError, FilterNotFoundError, InvalidIdError } from '../../../errors.ts';
import type { Context } from '../../../context.ts';

export default async function addAssortmentFilter(
  root: never,
  { assortmentId, filterId, ...assortmentFilter }: AssortmentFilter,
  { modules, userId }: Context,
) {
  log(`mutation addAssortmentFilter ${assortmentId} -> ${filterId}`, {
    userId,
  });

  if (!assortmentId) throw new InvalidIdError({ assortmentId });
  if (!filterId) throw new InvalidIdError({ filterId });

  if (!(await modules.assortments.assortmentExists({ assortmentId })))
    throw new AssortmentNotFoundError({ assortmentId });

  if (!(await modules.filters.filterExists({ filterId }))) throw new FilterNotFoundError({ filterId });

  return modules.assortments.filters.create({
    assortmentId,
    filterId,
    ...assortmentFilter,
  });
}
