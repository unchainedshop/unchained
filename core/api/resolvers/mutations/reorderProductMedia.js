import { log } from 'meteor/unchained:core-logger';
import { ProductMedia } from 'meteor/unchained:core-products';

export default function (root, { sortKeys = [] }, { userId }) {
  log('mutation reorderProductMedia', { userId });
  const changedMedia = sortKeys.map(({ productMediaId, sortKey }) => {
    ProductMedia.update({
      _id: productMediaId,
    }, {
      $set: { sortKey: sortKey + 1, updated: new Date() },
    });
    return ProductMedia.findOne({ _id: productMediaId });
  });
  return changedMedia;
}
