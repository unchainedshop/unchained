import { log } from 'meteor/unchained:core-logger';
import { Filters } from 'meteor/unchained:core-filters';
import { FilterNotFoundError, InvalidIdError } from '../../errors';

export default function createFilterOption(
  root,
  { option: inputData, filterId },
  { localeContext, userId }
) {
  log(`mutation createFilterOption ${filterId}`, { userId });

  if (!filterId) throw new InvalidIdError({ filterId });
  const filter = Filters.findOne({ _id: filterId });
  if (!filter) throw new FilterNotFoundError({ filterId });

  return Filters.setOptions({ filterId, inputData, localeContext, userId });
}
