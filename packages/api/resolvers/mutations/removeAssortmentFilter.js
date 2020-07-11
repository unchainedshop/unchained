import { log } from 'meteor/unchained:core-logger';
import { AssortmentFilters } from 'meteor/unchained:core-assortments';
import { AssortmentFilterNotFoundError } from '../../errors';

export default function (root, { assortmentFilterId }, { userId }) {
  log(`mutation removeAssortmentFilter ${assortmentFilterId}`, { userId });
  if (!assortmentFilterId)
    throw new Error('Invalid assortment filter ID provided');
  const assortmentFilter = AssortmentFilters.findOne({
    _id: assortmentFilterId,
  });
  if (!assortmentFilter)
    throw new AssortmentFilterNotFoundError({ assortmentFilterId });
  AssortmentFilters.remove({ _id: assortmentFilterId });
  return assortmentFilter;
}
