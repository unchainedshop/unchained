import { log } from 'meteor/unchained:logger';
import { Filters } from 'meteor/unchained:core-filters';
import { FilterNotFoundError, InvalidIdError } from '../../errors';

export default function removeFilterOption(
  root,
  { filterId, filterOptionValue },
  { userId }
) {
  log(`mutation removeFilterOption ${filterId}`, { userId });
  if (!filterId) throw new InvalidIdError({ filterId });
  if (!Filters.filterExists({ filterId }))
    throw new FilterNotFoundError({ filterId });
  Filters.removeFilterOption({ filterId, filterOptionValue });
  return Filters.findFilter({ filterId });
}
