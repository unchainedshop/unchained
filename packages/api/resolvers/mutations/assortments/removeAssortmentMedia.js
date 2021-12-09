import { log } from 'meteor/unchained:logger';
import { AssortmentMedia } from 'meteor/unchained:core-assortments';
import { AssortmentMediaNotFoundError, InvalidIdError } from '../../errors';

export default async function removeAssortmentMedia(
  root,
  { assortmentMediaId },
  { userId }
) {
  log(`mutation removeAssortmentMedia ${assortmentMediaId}`, { userId });
  if (!assortmentMediaId) throw new InvalidIdError({ assortmentMediaId });
  const assortmentMedia = AssortmentMedia.findAssortmentMedia({
    assortmentMediaId,
  });
  console.log(assortmentMediaId);
  if (!assortmentMedia)
    throw new AssortmentMediaNotFoundError({ assortmentMediaId });
  await AssortmentMedia.removeAssortmentMedia({ assortmentMediaId });
  return assortmentMedia;
}
