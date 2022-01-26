import { Context, Root } from '@unchainedshop/types/api';
import { log } from 'meteor/unchained:logger';

export default async function prepareProductMediaUpload(
  root: Root,
  { mediaName, productId }: { mediaName: string; productId: string },
  { modules, userId }: Context
) {
  log('mutation prepareProductMediaUpload', { mediaName, userId });

  return modules.files.createSignedURL(
    {
      directoryName: 'product-media',
      fileName: mediaName,
      meta: { productId },
    },
    userId,
    async (file) => {
      await modules.products.media.create(
        {
          productId,
          mediaId: file._id,
        },
        userId
      );
    }
  );
}
