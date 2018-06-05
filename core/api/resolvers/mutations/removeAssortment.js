import { log } from 'meteor/unchained:core-logger';
import { Assortments } from 'meteor/unchained:core-products';

export default function (root, { assortmentId }, { userId }) {
  log(`mutation removeAssortment ${assortmentId}`, { userId });
  const assortment = Assortments.findOne({ _id: assortmentId });
  Assortments.remove({ _id: assortmentId });
  return assortment;
}
