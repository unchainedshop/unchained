import { log } from 'meteor/unchained:logger';
import { Filters } from 'meteor/unchained:core-filters';

export default async function filters(
  root,
  { limit, offset, includeInactive },
  { userId }
) {
  log(
    `query filters: ${limit} ${offset} ${
      includeInactive ? 'includeInactive' : ''
    }`,
    { userId }
  );
  return Filters.findFilters({ limit, offset, includeInactive });
}
