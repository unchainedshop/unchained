import { log } from 'meteor/unchained:core-logger';
import { Assortments } from 'meteor/unchained:core-assortments';
import { AssortmentNotFoundError } from '../errors';

export default function (root, { parentAssortmentId, childAssortmentId }, { userId }) {
  log(`mutation addAssortmentLink ${parentAssortmentId} -> ${childAssortmentId}`, { userId });
  const assortment = Assortments.findOne({ _id: parentAssortmentId });
  if (!assortment) throw new AssortmentNotFoundError({ data: { parentAssortmentId } });
  return assortment.addLink({ assortmentId: childAssortmentId });
}
