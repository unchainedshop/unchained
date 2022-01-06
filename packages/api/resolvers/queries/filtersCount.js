import { log } from 'meteor/unchained:logger';
import { Filters } from 'meteor/unchained:core-filters';

export default async function filtersCount(root: Root, { includeInactive }, { modules, userId }: Context) {
  log(`query filtersCount: ${includeInactive ? 'includeInactive' : ''} `, {
    userId,
  });
  return Filters.count({ includeInactive });
}
