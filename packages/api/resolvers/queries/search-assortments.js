import { log } from 'meteor/unchained:core-logger';
import { searchAssortments } from 'meteor/unchained:core-filters';
import { QueryStringRequiredError } from '../../errors';

export default async function searchQuery(root, query, context) {
  const { userId } = context;
  const forceLiveCollection = false;
  const { queryString } = query;
  log(`query search assortments ${JSON.stringify(query)}`, { userId });

  if (!queryString) throw new QueryStringRequiredError({});

  return searchAssortments({ query, forceLiveCollection, context });
}
