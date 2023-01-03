import { log } from '@unchainedshop/logger';
import { Root, Context } from '@unchainedshop/types/api.js';
import { FilterNotFoundError, InvalidIdError } from '../../../errors.js';

export default async function removeFilterOption(
  root: Root,
  { filterId, filterOptionValue }: { filterId: string; filterOptionValue: string },
  context: Context,
) {
  const { modules, userId } = context;
  log(`mutation removeFilterOption ${filterId}`, { userId });

  if (!filterId || !filterOptionValue) throw new InvalidIdError({ filterId, filterOptionValue });

  if (!(await modules.filters.filterExists({ filterId }))) throw new FilterNotFoundError({ filterId });

  const filter = await modules.filters.removeFilterOption(
    {
      filterId,
      filterOptionValue,
    },
    context,
  );

  return filter;
}
