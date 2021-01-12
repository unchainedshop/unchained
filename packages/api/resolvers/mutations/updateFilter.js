import { log } from 'meteor/unchained:core-logger';
import { Filters } from 'meteor/unchained:core-filters';
import { FilterNotFoundError, InvalidIdError } from '../../errors';

export default function updateFilter(root, { filter, filterId }, { userId }) {
  log(`mutation updateFilter ${filterId}`, { userId });
  if (!filterId) throw new InvalidIdError({ filterId });
  if (!Filters.filterExists({ filterId }))
    throw new FilterNotFoundError({ filterId });
  return Filters.updateFilter({
    filterId,
    ...filter,
  });
}
