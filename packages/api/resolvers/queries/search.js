import { log } from 'meteor/unchained:core-logger';
import { Assortments } from 'meteor/unchained:core-assortments';
import { search } from 'meteor/unchained:core-filters';
import {
  QueryStringRequiredError,
  AssortmentNotFoundError,
} from '../../errors';

export default async function (root, query, context) {
  const { userId } = context;
  const forceLiveCollection = false;
  const { queryString, assortmentId, ignoreChildAssortments } = query;
  log(`query search ${assortmentId} ${JSON.stringify(query)}`, { userId });

  if (assortmentId) {
    const assortment = Assortments.findOne({ _id: assortmentId });
    if (!assortment) throw new AssortmentNotFoundError({ assortmentId });
    return assortment.search({
      query,
      forceLiveCollection,
      ignoreChildAssortments,
      context,
    });
  }
  if (!queryString) throw new QueryStringRequiredError({});
  return search({ query, forceLiveCollection, context });
}
