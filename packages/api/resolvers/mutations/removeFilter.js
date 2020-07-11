import { log } from 'meteor/unchained:core-logger';
import { Filters } from 'meteor/unchained:core-filters';
import { FilterNotFoundError } from '../../errors';

export default function (root, { filterId }, { userId }) {
  log(`mutation removeFilter ${filterId}`, { userId });
  if (!filterId) throw new Error('Invalid filter ID provided');
  const filter = Filters.findOne({ _id: filterId });
  if (!filter) throw new FilterNotFoundError({ filterId });
  return Filters.removeFilter({ filterId });
}
