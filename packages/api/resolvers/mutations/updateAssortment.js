import { log } from 'meteor/unchained:core-logger';
import { Assortments } from 'meteor/unchained:core-assortments';
import { AssortmentNotFoundError, InvalidIdError } from '../../errors';

export default function updateAssortment(
  root,
  { assortment: assortmentData, assortmentId },
  { userId }
) {
  log(`mutation updateAssortment ${assortmentId}`, { userId });
  if (!assortmentId) throw new InvalidIdError({ assortmentId });
  const assortment = Assortments.findOne({ _id: assortmentId });
  if (!assortment) throw new AssortmentNotFoundError({ assortmentId });
  return Assortments.updateAssortment({ assortmentId, ...assortmentData });
}
