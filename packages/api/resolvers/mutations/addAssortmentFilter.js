import { log } from 'meteor/unchained:core-logger';
import { Assortments } from 'meteor/unchained:core-assortments';
import { Filters } from 'meteor/unchained:core-filters';
import {
  AssortmentNotFoundError,
  FilterNotFoundError,
  InvalidIdError,
} from '../../errors';

export default function addAssortmentFilter(
  root,
  { assortmentId, filterId, ...assortmentFilter },
  { userId }
) {
  log(`mutation addAssortmentFilter ${assortmentId} -> ${filterId}`, {
    userId,
  });
  if (!assortmentId) throw new InvalidIdError({ assortmentId });
  if (!filterId) throw new InvalidIdError({ filterId });

  const assortment = Assortments.findOne({ _id: assortmentId });
  const filter = Filters.findOne({ _id: filterId });
  if (!assortment) throw new AssortmentNotFoundError({ assortmentId });
  if (!filter) throw new FilterNotFoundError({ filterId });
  return assortment.addFilter({
    filterId,
    authorId: userId,
    ...assortmentFilter,
  });
}
