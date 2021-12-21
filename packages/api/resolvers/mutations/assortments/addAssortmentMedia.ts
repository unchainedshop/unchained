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

  return await modules.assortments.media.addMedia({ rawFile: media, authorId: userId });
}
