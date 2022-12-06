import { Context, Root } from '@unchainedshop/types/api';
import { log } from '@unchainedshop/logger';

export default async function prepareProductMediaUpload(
  root: Root,
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
