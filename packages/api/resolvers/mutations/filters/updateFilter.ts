import { log } from 'meteor/unchained:logger';
import { Root, Context } from '@unchainedshop/types/api';
import { FilterNotFoundError, InvalidIdError } from '../../../errors';
import { Filter } from '@unchainedshop/types/filters';

export default async function updateFilter(
  root: Root,
  { filter, filterId }: { filter: Filter; filterId: string },
  { modules, userId }: Context
) {
  log(`mutation updateFilter ${filterId}`, { userId });

  if (!filterId) throw new InvalidIdError({ filterId });

  if (!(await modules.filters.filterExists({ filterId })))
    throw new FilterNotFoundError({ filterId });

  return await modules.filters.update(filterId, filter, userId);
}
