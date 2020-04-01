import { log } from 'meteor/unchained:core-logger';
import { Filters } from 'meteor/unchained:core-filters';

export default function (root, { limit, offset, includeInactive }, { userId }) {
  log(`query filters: ${limit} ${offset}`, { userId });
  const selector = {};
  if (!includeInactive) {
    selector.isActive = true;
  }
  const filters = Filters.find(selector, { skip: offset, limit }).fetch();
  return filters;
}
