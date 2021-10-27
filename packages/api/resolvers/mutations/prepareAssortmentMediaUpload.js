import { log } from 'meteor/unchained:core-logger';
import { AssortmentMedia } from 'meteor/unchained:core-assortments/assortments';

export default async function prepareAssortmentMediaUpload(
  root,
  { mediaName, assortmentId },
  { userId, ...context }
) {
  log('mutation prepareAssortmentMediaUpload', { mediaName, userId });

  return AssortmentMedia.createSignedUploadURL(
    { mediaName, assortmentId },
    {
      userId,
      ...context,
    }
  );
}
