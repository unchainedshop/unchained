import { log } from 'meteor/unchained:core-logger';
import { Assortments } from 'meteor/unchained:core-assortments';
import { AssortmentNotFoundError } from '../../errors';

export default function(root, { assortmentId }, { userId }) {
  log(`mutation removeAssortment ${assortmentId}`, { userId });
  const assortment = Assortments.findOne({ _id: assortmentId });
  if (!assortment)
    throw new AssortmentNotFoundError({ data: { assortmentId } });
  Assortments.remove({ _id: assortmentId });
  return assortment;
}
