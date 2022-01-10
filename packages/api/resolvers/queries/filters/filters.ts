import { log } from 'meteor/unchained:logger';
import { Root, Context } from '@unchainedshop/types/api';

export default async function filters(
  root: Root,
  { limit, offset, includeInactive },
  { modules, userId }: Context
) {
  log(
    `query filters: ${limit} ${offset} ${
      includeInactive ? 'includeInactive' : ''
    }`,
    { userId }
  );

  return await modules.filters.findFilters({ limit, offset, includeInactive });
}
