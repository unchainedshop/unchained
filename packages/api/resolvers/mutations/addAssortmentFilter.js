import { log } from 'meteor/unchained:core-logger';
import { Assortments } from 'meteor/unchained:core-assortments';
import { AssortmentNotFoundError } from '../../errors';

export default function (root, { assortmentId, filterId, tags }, { userId }) {
  log(`mutation addAssortmentFilter ${assortmentId} -> ${filterId}`, {
    userId,
  });
  const assortment = Assortments.findOne({ _id: assortmentId });
  if (!assortment) throw new AssortmentNotFoundError({ assortmentId });
  return assortment.addFilter({ filterId, tags });
}
