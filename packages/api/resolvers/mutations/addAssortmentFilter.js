import { log } from 'meteor/unchained:core-logger';
import {
  Assortments,
  AssortmentFilters,
} from 'meteor/unchained:core-assortments';
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
  const assortment = Assortments.findAssortment({ assortmentId });
  if (!assortment) throw new AssortmentNotFoundError({ assortmentId });
  const filter = Filters.findFilter({ filterId });
  if (!filter) throw new FilterNotFoundError({ filterId });

  return AssortmentFilters.createAssortmentFilter({
    assortmentId,
    authorId: userId,
    filterId,
    ...assortmentFilter,
  });
}
