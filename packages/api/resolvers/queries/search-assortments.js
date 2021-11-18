import { log } from 'unchained-logger';
import { searchAssortments } from 'meteor/unchained:core-filters';

export default async function searchQuery(root, query, context) {
  const { userId } = context;
  const forceLiveCollection = false;
  log(`query search assortments ${JSON.stringify(query)}`, { userId });
  return searchAssortments({ query, forceLiveCollection, context });
}
