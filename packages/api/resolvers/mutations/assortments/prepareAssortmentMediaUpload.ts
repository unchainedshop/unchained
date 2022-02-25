import { Context, Root } from '@unchainedshop/types/api';
import { log } from 'meteor/unchained:logger';

export default async function prepareAssortmentMediaUpload(
  root: Root,
  { mediaName, assortmentId }: { mediaName: string; assortmentId: string },
  context: Context,
) {
  const { services, userId } = context;
  log('mutation prepareAssortmentMediaUpload', { mediaName, userId });

  const preparedFile = await services.files.createSignedURL(
    {
      directoryName: 'assortment-media',
      fileName: mediaName,
      meta: { assortmentId },
      userId,
    },
    context
  );

  return preparedFile;
}
