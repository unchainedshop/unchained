import { log } from 'meteor/unchained:core-logger';
import { Assortments } from 'meteor/unchained:core-assortments';

export default function addAssortmentMediaLink(
  root,
  { mediaUploadTicketId, assortmentId },
  { userId }
) {
  log(`mutation addAssortmentMediaLink `, { userId });
  const assortment = Assortments.findAssortment({ assortmentId });
  return assortment.addMediaLink({
    mediaId: mediaUploadTicketId,
    authorId: userId,
  });
}
