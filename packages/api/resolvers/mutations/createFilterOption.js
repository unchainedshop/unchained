import { log } from 'meteor/unchained:core-logger';
import { Filters } from 'meteor/unchained:core-filters';
import { FilterNotFoundError, InvalidIdError } from '../../errors';

export default function createFilterOption(
  root,
  { option, filterId },
  { localeContext, userId }
) {
  log(`mutation createFilterOption ${filterId}`, { userId });

  if (!filterId) throw new InvalidIdError({ filterId });
  if (!Filters.filterExists({ filterId }))
    throw new FilterNotFoundError({ filterId });

  filter.addOption({ option, localeContext, userId });
  return Filters.findFilter({ filterId });
}
