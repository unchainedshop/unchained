import { log } from 'meteor/unchained:core-logger';
import { Filters } from 'meteor/unchained:core-filters';
import { FilterNotFoundError, InvalidIdError } from '../../errors';

export default function removeFilterOption(
  root,
  { filterId, filterOptionValue },
  { userId }
) {
  log(`mutation removeFilterOption ${filterId}`, { userId });
  if (!filterId) throw new InvalidIdError({ filterId });
  const filter = Filters.findFilter({ filterId });
  if (!filter) throw new FilterNotFoundError({ filterId });
  Filters.removeFilterOption({ filterId, filterOptionValue });
  return Filters.findFilter({ filterId });
}
