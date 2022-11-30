import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api';
import { AssortmentNotFoundError, InvalidIdError } from '../../../errors';

export default async function addAssortmentMedia(root: Root, { media, assortmentId }, context: Context) {
  const { modules, services, userId } = context;
  log(`mutation addAssortmentMedia ${assortmentId}`, { userId });

  if (!assortmentId) throw new InvalidIdError({ assortmentId });

  if (!(await modules.assortments.assortmentExists({ assortmentId })))
    throw new AssortmentNotFoundError({ assortmentId });

  const file = await services.files.uploadFileFromStream(
    {
      directoryName: 'assortment-media',
      rawFile: media,
      meta: { authorId: userId },
    },
    context,
  );

  const assortmentMedia = await modules.assortments.media.create({ assortmentId, mediaId: file._id });

  return assortmentMedia;
}
