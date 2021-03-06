import { log } from 'meteor/unchained:core-logger';
import { Assortments } from 'meteor/unchained:core-assortments';
import { AssortmentNotFoundError, InvalidIdError } from '../../errors';

export default function addAssortmentMedia(
  root,
  { media, assortmentId },
  { userId }
) {
  log(`mutation addAssortmentMedia ${assortmentId}`, { userId });
  if (!assortmentId) throw new InvalidIdError({ assortmentId });
  const assortment = Assortments.findAssortment({ assortmentId });
  if (!assortment) throw new AssortmentNotFoundError({ assortmentId });
  return assortment.addMedia({ rawFile: media, authorId: userId });
}
