import { log } from 'meteor/unchained:core-logger';
import { AssortmentMedia } from 'meteor/unchained:core-assortments';
import { InvalidIdError, AssortmentMediaNotFoundError } from '../../errors';

export default function updateAssortmentMediaTexts(
  root,
  { texts, assortmentMediaId },
  { userId }
) {
  log(`mutation updateAssortmentMediaTexts ${assortmentMediaId}`, { userId });
  if (!assortmentMediaId) throw new InvalidIdError({ assortmentMediaId });
  const assortmentMedia = AssortmentMedia.findAssortmentMedia({
    assortmentMediaId,
  });
  if (!assortmentMedia)
    throw new AssortmentMediaNotFoundError({ assortmentMediaId });
  return assortmentMedia.updateTexts({ texts, userId });
}
