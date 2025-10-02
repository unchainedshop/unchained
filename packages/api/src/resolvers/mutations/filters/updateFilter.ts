import { log } from '@unchainedshop/logger';
import { Filter } from '@unchainedshop/core-filters';
import { FilterNotFoundError, InvalidIdError } from '../../../errors.js';
import { Context } from '../../../context.js';
import { FilterDirector } from '@unchainedshop/core';

export default async function updateFilter(
  root: never,
  { filter, filterId }: { filter: Filter; filterId: string },
  context: Context,
) {
  const { modules, userId } = context;

  log(`mutation updateFilter ${filterId}`, { userId });

  if (!filterId) throw new InvalidIdError({ filterId });

  if (!(await modules.filters.filterExists({ filterId }))) throw new FilterNotFoundError({ filterId });

  const updatedFilter = await modules.filters.update(filterId, filter);
  await FilterDirector.invalidateProductIdCache(updatedFilter!, context);

  return updatedFilter;
}
