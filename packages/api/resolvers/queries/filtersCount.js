import { log } from 'unchained-logger';
import { Filters } from 'meteor/unchained:core-filters';

export default function filtersCount(root, { includeInactive }, { userId }) {
  log(`query filtersCount: ${includeInactive ? 'includeInactive' : ''} `, {
    userId,
  });
  return Filters.count({ includeInactive });
}
