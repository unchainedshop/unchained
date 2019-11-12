import { log } from 'meteor/unchained:core-logger';
import { Quotations } from 'meteor/unchained:core-quotations';
import { Assortments } from 'meteor/unchained:core-assortments';
import { facetedSearch, fulltextSearch } from 'meteor/unchained:core-filters';
import { QueryStringRequiredError, AssortmentNotFoundError } from '../../errors';

export default async function search(root, query, { userId }) {
  const { queryString, assortmentId } = query;
  log(`query search ${assortmentId} ${JSON.stringify(query)}`, { userId });

  if (assortmentId) {
    const assortment = Assortments.findOne({ _id: assortmentId });
    if (!assortment) throw new AssortmentNotFoundError({ assortmentId })
    return assortment.search(query);
  }
  if (!queryString) throw new QueryStringRequiredError({});
  const fulltextQuery = await fulltextSearch(query)
  return facetedSearch({
    ...query,
    ...fulltextQuery
  })
  return null;
}
