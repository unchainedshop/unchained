import { log } from '@unchainedshop/logger';
import { Context } from '../../../context.js';

export default async function prepareAssortmentMediaUpload(
  root: never,
  {
    mediaName,
    assortmentId,
    asPrivate,
  }: { mediaName: string; assortmentId: string; asPrivate?: boolean },
  context: Context,
) {
  const { services, userId } = context;
  log('mutation prepareAssortmentMediaUpload', { mediaName, userId });

  const preparedFile = await services.files.createSignedURL(
    {
      directoryName: 'assortment-media',
      fileName: mediaName,
      meta: { assortmentId },
      isPrivate: Boolean(asPrivate),
    },
    context,
  );

  return preparedFile;
}
