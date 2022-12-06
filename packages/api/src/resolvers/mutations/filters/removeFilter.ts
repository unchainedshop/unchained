import { log } from '@unchainedshop/logger';
import { Root, Context } from '@unchainedshop/types/api';
import { FilterNotFoundError, InvalidIdError } from '../../../errors';

export default async function removeFilter(
  root: Root,
  { filterId }: { filterId: string },
  context: Context,
) {
  const { modules, userId } = context;
  log(`mutation removeFilter ${filterId}`, { userId });

  if (!filterId) throw new InvalidIdError({ filterId });

  const filter = await modules.filters.findFilter({ filterId });
  if (!filter) throw new FilterNotFoundError({ filterId });

  await modules.assortments.filters.deleteMany({ filterId });
  await modules.filters.delete(filterId);

  return filter;
}
