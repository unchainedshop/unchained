import { log } from 'meteor/unchained:core-logger';
import { Assortments } from 'meteor/unchained:core-assortments';
import { searchProducts } from 'meteor/unchained:core-filters';
import {
  QueryStringRequiredError,
  AssortmentNotFoundError,
} from '../../errors';

export default async function searchQuery(root, query, context) {
  const { userId } = context;
  const forceLiveCollection = false;
  const { queryString, assortmentId, ignoreChildAssortments } = query;
  log(`query search ${assortmentId} ${JSON.stringify(query)}`, { userId });
  if (assortmentId) {
    const assortment = Assortments.findAssortment({ assortmentId });
    if (!assortment) throw new AssortmentNotFoundError({ assortmentId });
    return assortment.searchProducts({
      query,
      forceLiveCollection,
      ignoreChildAssortments,
      context,
    });
  }

  if (!queryString) throw new QueryStringRequiredError({});
  return searchProducts({ query, forceLiveCollection, context });
}
