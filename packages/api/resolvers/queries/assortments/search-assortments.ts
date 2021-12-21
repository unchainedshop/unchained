import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';

// import { searchAssortments } from 'meteor/unchained:core-filters';
// TODO: implement correctly
export default async function searchQuery(
  root: Root,
  query,
  { modules, userId }: Context
) {
  const forceLiveCollection = false;

  log(`query search assortments ${JSON.stringify(query)}`, { userId });

  return modules.filters.searchAssortments({
    query,
    forceLiveCollection,
    userId,
  });
}
