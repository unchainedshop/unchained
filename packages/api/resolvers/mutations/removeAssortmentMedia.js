import { log } from 'meteor/unchained:core-logger';
import { AssortmentMedia } from 'meteor/unchained:core-assortments';
import { AssortmentMediaNotFoundError, InvalidIdError } from '../../errors';

export default function removeAssortmentMedia(
  root,
  { assortmentMediaId },
  { userId }
) {
  log(`mutation removeAssortmentMedia ${assortmentMediaId}`, { userId });
  if (!assortmentMediaId) throw new InvalidIdError({ assortmentMediaId });
  const assortmentMedia = AssortmentMedia.findAssortmentMedia({
    assortmentMediaId,
  });
  if (!assortmentMedia)
    throw new AssortmentMediaNotFoundError({ assortmentMediaId });
  AssortmentMedia.removeAssortmentMedia({ assortmentMediaId });
  return assortmentMedia;
}
