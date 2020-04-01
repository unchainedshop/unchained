import { log } from 'meteor/unchained:core-logger';
import { Filters } from 'meteor/unchained:core-filters';

export default function (root, { filter, filterId }, { userId }) {
  log(`mutation updateFilter ${filterId}`, { userId });
  return Filters.updateFilter({
    filterId,
    ...filter,
  });
}
