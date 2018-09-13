import { log } from 'meteor/unchained:core-logger';
import { AssortmentFilters } from 'meteor/unchained:core-assortments';

export default function (root, { sortKeys = [] }, { userId }) {
  log('mutation reorderAssortmentFilters', { userId });
  const changedAssortmentFilterIds = sortKeys.map(({ assortmentFilterId, sortKey }) => {
    AssortmentFilters.update({
      _id: assortmentFilterId,
    }, {
      $set: { sortKey: sortKey + 1, updated: new Date() },
    });
    return assortmentFilterId;
  });
  return AssortmentFilters
    .find({ _id: { $in: changedAssortmentFilterIds } })
    .fetch();
}
