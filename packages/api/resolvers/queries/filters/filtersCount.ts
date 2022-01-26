import { log } from 'meteor/unchained:logger';
import { Root, Context } from '@unchainedshop/types/api';

export default async function filtersCount(
  root: Root,
  { includeInactive }: { includeInactive: boolean },
  { modules, userId }: Context,
) {
  log(`query filtersCount: ${includeInactive ? 'includeInactive' : ''} `, {
    userId,
  });

  return modules.filters.count({ includeInactive });
}
