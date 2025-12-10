import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';

export default async function prepareAssortmentMediaUpload(
  root: never,
  { mediaName, assortmentId }: { mediaName: string; assortmentId: string },
  context: Context,
) {
  const { services, userId } = context;
  log('mutation prepareAssortmentMediaUpload', { mediaName, userId });

  const preparedFile = await services.files.createSignedURL({
    directoryName: 'assortment-media',
    fileName: mediaName,
    meta: { assortmentId },
  });

  return preparedFile;
}
