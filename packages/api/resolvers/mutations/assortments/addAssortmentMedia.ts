import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';
import { AssortmentNotFoundError, InvalidIdError } from '../../../errors';

export default async function addAssortmentMedia(
  root: Root,
  { media, assortmentId },
  { modules, userId }: Context
) {
  log(`mutation addAssortmentMedia ${assortmentId}`, { modules, userId });

  if (!assortmentId) throw new InvalidIdError({ assortmentId });

  if (!(await modules.assortments.assortmentExists({ assortmentId })))
    throw new AssortmentNotFoundError({ assortmentId });

  const file = await modules.files.uploadFileFromStream(
    {
      directoryName: 'assortment-media',
      rawFile: media,
      meta: { authorId: userId },
    },
    userId
  );

  const assortmentMedia = await modules.assortments.media.create(
    { assortmentId, mediaId: file._id },
    userId
  );

  return assortmentMedia;
}
