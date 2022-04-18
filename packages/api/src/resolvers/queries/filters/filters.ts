import { log } from 'meteor/unchained:logger';
import { Root, Context } from '@unchainedshop/types/api';

export default async function filters(
  root: Root,
  { limit, offset, includeInactive, queryString },
  { modules, userId }: Context,
) {
  log(`query filters: ${limit} ${offset} ${includeInactive ? 'includeInactive' : ''}`, { userId });

  return modules.filters.findFilters({ limit, offset, includeInactive, queryString });
}
