import { log } from 'meteor/unchained:core-logger';
import { Assortments } from 'meteor/unchained:core-assortments';
import { InvalidIdError, AssortmentNotFoundError } from '../../errors';

export default function updateAssortmentTexts(
  root,
  { texts, assortmentId },
  { userId }
) {
  log(`mutation updateAssortmentTexts ${assortmentId}`, { userId });
  if (!assortmentId) throw new InvalidIdError({ assortmentId });
  const assortment = Assortments.findAssortment({ assortmentId });
  if (!assortment) throw new AssortmentNotFoundError({ assortmentId });
  return assortment.updateTexts({ texts, userId });
}
