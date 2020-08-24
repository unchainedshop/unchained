import { log } from 'meteor/unchained:core-logger';
import { Filters } from 'meteor/unchained:core-filters';
import { FilterNotFoundError, InvalidIdError } from '../../errors';

export default function filter(root, { filterId }, { userId }) {
  log(`query filter ${filterId}`, { userId });

  if (!filterId) throw new InvalidIdError({ filterId });
  const filter = Filters.findOne({ _id: filterId });
  if (!filter) throw new FilterNotFoundError({ filterId });

  return filter;
}
