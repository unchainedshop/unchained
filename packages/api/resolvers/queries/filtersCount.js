import { log } from 'meteor/unchained:core-logger';
import { Filters } from 'meteor/unchained:core-filters';

export default function filtersCount(root, { includeInactive }, { userId }) {
  log(`query filtersCount: ${includeInactive ? 'includeInactive' : ''} `, {
    userId,
  });
  return Filters.count({ includeInactive });
}
