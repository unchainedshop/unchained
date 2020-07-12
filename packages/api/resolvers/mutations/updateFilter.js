import { log } from 'meteor/unchained:core-logger';
import { Filters } from 'meteor/unchained:core-filters';
import { FilterNotFoundError } from '../../errors';

export default function (root, { filter, filterId }, { userId }) {
  log(`mutation updateFilter ${filterId}`, { userId });
  if (!filterId) throw new Error('Invalid filter ID provided');
  const filterObject = Filters.findOne({ _id: filterId });
  if (!filterObject) throw new FilterNotFoundError({ filterId });
  return Filters.updateFilter({
    filterId,
    ...filter,
  });
}
