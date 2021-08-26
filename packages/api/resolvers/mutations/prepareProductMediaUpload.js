import { log } from 'meteor/unchained:core-logger';
import { ProductMedia } from 'meteor/unchained:core-products';

export default async function prepareProductMediaUpload(
  root,
  { mediaName },
  { userId, ...context }
) {
  log('mutation prepareProductMediaUpload', { mediaName, userId });

  return ProductMedia.createSignedUploadURL(mediaName, {
    userId,
    ...context,
  });
}
