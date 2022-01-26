import { Context, Root } from '@unchainedshop/types/api';
import { log } from 'meteor/unchained:logger';

export default async function prepareAssortmentMediaUpload(
  root: Root,
  { mediaName, assortmentId }: { mediaName: string; assortmentId: string },
  { modules, userId }: Context,
) {
  log('mutation prepareAssortmentMediaUpload', { mediaName, userId });

  const preparedFile = await modules.files.createSignedURL(
    {
      directoryName: 'assortment-media',
      fileName: mediaName,
      meta: { assortmentId },
    },
    userId,
    async (file) => {
      await modules.assortments.media.create(
        {
          assortmentId,
          mediaId: file._id,
        },
        userId,
      );
    },
  );

  return preparedFile;
}
