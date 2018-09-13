import { log } from 'meteor/unchained:core-logger';
import { Filters } from 'meteor/unchained:core-filters';

export default function (root, {
  limit = 10, offset = 0,
}, { userId }) {
  log(`query filters: ${limit} ${offset}`, { userId });
  const selector = { };
  const filters = Filters.find(selector, { skip: offset, limit }).fetch();
  return filters;
}
