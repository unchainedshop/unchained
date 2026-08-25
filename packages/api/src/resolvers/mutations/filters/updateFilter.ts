import { log } from '@unchainedshop/logger';
import type { Filter } from '@unchainedshop/core-filters';
import { FilterNotFoundError, InvalidIdError } from '../../../errors.ts';
import type { Context } from '../../../context.ts';

export default async function updateFilter(
  root: never,
  { filter, filterId }: { filter: Filter; filterId: string },
  context: Context,
) {
  const { modules, services, userId } = context;

  log(`mutation updateFilter ${filterId}`, { userId });

  if (!filterId) throw new InvalidIdError({ filterId });

  if (!(await modules.filters.filterExists({ filterId }))) throw new FilterNotFoundError({ filterId });

  return services.filters.updateFilter(filterId, filter);
}
