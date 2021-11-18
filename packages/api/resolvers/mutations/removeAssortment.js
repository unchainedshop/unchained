import { log } from 'unchained-logger';
import { Assortments } from 'meteor/unchained:core-assortments';
import { AssortmentNotFoundError, InvalidIdError } from '../../errors';

export default function removeAssortment(root, { assortmentId }, { userId }) {
  log(`mutation removeAssortment ${assortmentId}`, { userId });
  if (!assortmentId) throw new InvalidIdError({ assortmentId });
  const assortment = Assortments.findAssortment({ assortmentId });
  if (!assortment) throw new AssortmentNotFoundError({ assortmentId });
  Assortments.removeAssortment({ assortmentId });
  return assortment;
}
