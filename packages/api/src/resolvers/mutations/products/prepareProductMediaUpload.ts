import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';

export default async function prepareProductMediaUpload(
  root: never,
  { mediaName, productId, asPrivate }: { mediaName: string; productId: string; asPrivate?: boolean },
  context: Context,
) {
  const { services, userId } = context;
  log('mutation prepareProductMediaUpload', { mediaName, userId });

  return services.files.createSignedURL(
    {
      directoryName: 'product-media',
      fileName: mediaName,
      meta: { productId },
      isPrivate: Boolean(asPrivate),
    },
    context,
  );
}
