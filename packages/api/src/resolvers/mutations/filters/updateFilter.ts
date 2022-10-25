import { log } from '@unchainedshop/logger';
import { Root, Context } from '@unchainedshop/types/api';
import { Filter } from '@unchainedshop/types/filters';
import { FilterNotFoundError, InvalidIdError } from '../../../errors';

export default async function updateFilter(
  root: Root,
  { filter, filterId }: { filter: Filter; filterId: string },
  context: Context,
) {
  const { modules, userId } = context;

  log(`mutation updateFilter ${filterId}`, { userId });

  if (!filterId) throw new InvalidIdError({ filterId });

  if (!(await modules.filters.filterExists({ filterId }))) throw new FilterNotFoundError({ filterId });

  await modules.filters.update(filterId, filter, context, { skipInvalidation: false }, userId);

  return modules.filters.findFilter({ filterId });
}
