import { log } from 'meteor/unchained:core-logger';
import { ProductMedia } from 'meteor/unchained:core-products';

export default async function prepareProductMediaUpload(
  root,
  { mediaName, productId },
  { userId, ...context }
) {
  log('mutation prepareProductMediaUpload', { mediaName, userId });

  return ProductMedia.createSignedUploadURL(
    { mediaName, productId },
    {
      userId,
      ...context,
    }
  );
}
