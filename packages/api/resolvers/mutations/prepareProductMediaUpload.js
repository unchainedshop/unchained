import { log } from 'meteor/unchained:core-logger';
import { createSignedPutURL } from 'meteor/unchained:core-files-next';

export default async function prepareProductMediaUpload(
  root,
  { options: { name } },
  { userId, ...context }
) {
  log('mutation prepareProductMediaUpload', { name, userId });

  return createSignedPutURL(name, { userId, ...context });
}
