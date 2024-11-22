import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';

export default async function prepareProductMediaUpload(
  root: never,
  { mediaName, productId }: { mediaName: string; productId: string },
  context: Context,
) {
  const { services, userId } = context;
  log('mutation prepareProductMediaUpload', { mediaName, userId });

  return services.files.createSignedURL(
    {
      directoryName: 'product-media',
      fileName: mediaName,
      meta: { productId },
    },
    context,
  );
}
