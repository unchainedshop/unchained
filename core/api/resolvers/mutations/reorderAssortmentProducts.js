import { log } from 'meteor/unchained:core-logger';
import { AssortmentProducts } from 'meteor/unchained:core-assortments';

export default function (root, { sortKeys = [] }, { userId }) {
  log('mutation reorderAssortmentProducts', { userId });
  const changedAssortmentProductIds = sortKeys.map(({ assortmentProductId, sortKey }) => {
    AssortmentProducts.update({
      _id: assortmentProductId,
    }, {
      $set: {
        sortKey: sortKey + 1,
        updated: new Date(),
      },
    });
    return assortmentProductId;
  });
  return AssortmentProducts
    .find({ _id: { $in: changedAssortmentProductIds } })
    .fetch();
}
