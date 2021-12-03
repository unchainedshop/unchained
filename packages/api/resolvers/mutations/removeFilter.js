import { log } from 'meteor/unchained:logger';
import { Filters } from 'meteor/unchained:core-filters';
import { FilterNotFoundError, InvalidIdError } from '../../errors';

export default function removeFilter(root, { filterId }, { userId }) {
  log(`mutation removeFilter ${filterId}`, { userId });
  if (!filterId) throw new InvalidIdError({ filterId });
  if (!Filters.filterExists({ filterId }))
    throw new FilterNotFoundError({ filterId });
  Filters.removeFilter({ filterId });
  return Filters.findFilter({ filterId });
}
