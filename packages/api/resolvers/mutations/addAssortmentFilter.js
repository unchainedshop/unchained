import { log } from 'meteor/unchained:core-logger';
import { Assortments } from 'meteor/unchained:core-assortments';
import { Filters } from 'meteor/unchained:core-filters';
import { AssortmentNotFoundError, FilterNotFoundError } from '../../errors';

export default function addAssortmentFilter(
  root,
  { assortmentId, filterId, tags },
  { userId },
) {
  log(`mutation addAssortmentFilter ${assortmentId} -> ${filterId}`, {
    userId,
  });
  const assortment = Assortments.findOne({ _id: assortmentId });
  const filter = Filters.findOne({ _id: filterId });
  if (!assortment) throw new AssortmentNotFoundError({ assortmentId });
  if (!filter) throw new FilterNotFoundError({ filterId });
  return assortment.addFilter({ filterId, tags, authorId: userId });
}
