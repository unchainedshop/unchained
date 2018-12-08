import { log } from 'meteor/unchained:core-logger';
import { AssortmentFilters } from 'meteor/unchained:core-assortments';

export default function (root, { assortmentFilterId }, { userId }) {
  log(`mutation removeAssortmentFilter ${assortmentFilterId}`, { userId });
  const assortmentFilter = AssortmentFilters.findOne({ _id: assortmentFilterId });
  AssortmentFilters.remove({ _id: assortmentFilterId });
  return assortmentFilter;
}
