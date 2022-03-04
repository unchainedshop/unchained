import { log } from 'meteor/unchained:logger';
import { Root, Context } from '@unchainedshop/types/api';
import { FilterNotFoundError, InvalidIdError } from '../../../errors';

export default async function removeFilter(
  root: Root,
  { filterId }: { filterId: string },
  requestContext: Context,
) {
  const { modules, userId } = requestContext;
  log(`mutation removeFilter ${filterId}`, { userId });

  if (!filterId) throw new InvalidIdError({ filterId });

  const filter = await modules.filters.findFilter({ filterId });
  if (!filter) throw new FilterNotFoundError({ filterId });

  await modules.assortments.filters.deleteMany({ filterId }, userId);
  const deletedCount = await modules.filters.delete(filterId, userId);
  if (deletedCount === 1) {
    await modules.filters.invalidateCache({}, requestContext);
  }

  return filter;
}
