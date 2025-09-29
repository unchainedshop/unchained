import { log } from '@unchainedshop/logger';
import { FilterNotFoundError, InvalidIdError } from '../../../errors.js';
import { Context } from '../../../context.js';
import { FilterDirector } from '@unchainedshop/core';

export default async function removeFilterOption(
  root: never,
  { filterId, filterOptionValue }: { filterId: string; filterOptionValue: string },
  context: Context,
) {
  const { modules, userId } = context;
  log(`mutation removeFilterOption ${filterId}`, { userId });

  if (!filterId || !filterOptionValue) throw new InvalidIdError({ filterId, filterOptionValue });

  if (!(await modules.filters.filterExists({ filterId }))) throw new FilterNotFoundError({ filterId });

  const filter = await modules.filters.removeFilterOption({
    filterId,
    filterOptionValue,
  });
  await FilterDirector.invalidateProductIdCache(filter!, context);

  return filter;
}
