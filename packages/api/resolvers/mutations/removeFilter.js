import { log } from 'meteor/unchained:core-logger';
import { Filters } from 'meteor/unchained:core-filters';
import { FilterNotFoundError, InvalidIdError } from '../../errors';

export default function removeFilter(root, { filterId }, { userId }) {
  log(`mutation removeFilter ${filterId}`, { userId });
  if (!filterId) throw new InvalidIdError({ filterId });
  const filter = Filters.findFilter({ filterId });
  if (!filter) throw new FilterNotFoundError({ filterId });
  return Filters.removeFilter({ filterId });
}
