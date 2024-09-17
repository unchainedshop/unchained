import { log } from '@unchainedshop/logger';
import { Filter } from '@unchainedshop/core-filters';
import { FilterNotFoundError, InvalidIdError } from '../../../errors.js';
import { Context } from '../../../types.js';

export default async function updateFilter(
  root: never,
  { filter, filterId }: { filter: Filter; filterId: string },
  context: Context,
) {
  const { modules, userId } = context;

  log(`mutation updateFilter ${filterId}`, { userId });

  if (!filterId) throw new InvalidIdError({ filterId });

  if (!(await modules.filters.filterExists({ filterId }))) throw new FilterNotFoundError({ filterId });

  return modules.filters.update(filterId, filter, context);
}
