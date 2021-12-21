import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';
import { AssortmentMediaNotFoundError, InvalidIdError } from '../../../errors';

export default async function removeAssortmentMedia(
  root: Root,
  { assortmentMediaId }: { assortmentMediaId: string },
  { modules, userId }: Context
) {
  log(`mutation removeAssortmentMedia ${assortmentMediaId}`, {
    modules,
    userId,
  });

  if (!assortmentMediaId) throw new InvalidIdError({ assortmentMediaId });

  const assortmentMedia = await modules.assortments.media.findAssortmentMedia({
    assortmentMediaId,
  });
  if (!assortmentMedia)
    throw new AssortmentMediaNotFoundError({ assortmentMediaId });

  await modules.assortments.media.delete(assortmentMediaId, userId);

  return assortmentMedia;
}
