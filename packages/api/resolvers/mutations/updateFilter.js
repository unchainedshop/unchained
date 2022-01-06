import { log } from 'meteor/unchained:logger';
import { Filters } from 'meteor/unchained:core-filters';
import { FilterNotFoundError, InvalidIdError } from '../../../errors';

export default async function updateFilter(root: Root, { filter, filterId }, { modules, userId }: Context) {
  log(`mutation updateFilter ${filterId}`, { userId });
  if (!filterId) throw new InvalidIdError({ filterId });
  if (!Filters.filterExists({ filterId }))
    throw new FilterNotFoundError({ filterId });
  return Filters.updateFilter({
    filterId,
    ...filter,
  });
}
