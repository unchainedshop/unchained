import { log } from 'meteor/unchained:core-logger';
import { AssortmentFilters } from 'meteor/unchained:core-assortments';
import { AssortmentFilterNotFoundError, InvalidIdError } from '../../errors';

export default function removeAssortmentFilter(
  root,
  { assortmentFilterId },
  { userId },
) {
  log(`mutation removeAssortmentFilter ${assortmentFilterId}`, { userId });
  if (!assortmentFilterId) throw new InvalidIdError({ assortmentFilterId });
  const assortmentFilter = AssortmentFilters.findOne({
    _id: assortmentFilterId,
  });
  if (!assortmentFilter)
    throw new AssortmentFilterNotFoundError({ assortmentFilterId });
  AssortmentFilters.remove({ _id: assortmentFilterId });
  return assortmentFilter;
}
