import { log } from 'meteor/unchained:logger';
import { Filters } from 'meteor/unchained:core-filters';
import { FilterNotFoundError, InvalidIdError } from '../../errors';

export default function createFilterOption(
  root,
  { option, filterId },
  { localeContext, userId }
) {
  log(`mutation createFilterOption ${filterId}`, { userId });

  if (!filterId) throw new InvalidIdError({ filterId });

  const filter = Filters.findFilter({ filterId });
  if (!filter) throw new FilterNotFoundError({ filterId });

  filter.addOption({ option, localeContext, userId });
  return Filters.findFilter({ filterId });
}
