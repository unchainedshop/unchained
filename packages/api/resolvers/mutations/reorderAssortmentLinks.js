import { log } from 'meteor/unchained:core-logger';
import { AssortmentLinks } from 'meteor/unchained:core-assortments';

export default function (root, { sortKeys = [] }, { userId }) {
  log('mutation reorderAssortmentLinks', { userId });
  const changedAssortmentLinkIds = sortKeys.map(({ assortmentLinkId, sortKey }) => {
    AssortmentLinks.update({
      _id: assortmentLinkId,
    }, {
      $set: { sortKey: sortKey + 1, updated: new Date() },
    });
    return assortmentLinkId;
  });
  return AssortmentLinks
    .find({ _id: { $in: changedAssortmentLinkIds } })
    .fetch();
}
