import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api';
import { ProductMediaNotFoundError, InvalidIdError } from '../../../errors';

export default async function removeProductMedia(
  root: Root,
  { productMediaId }: { productMediaId: string },
  { modules, userId }: Context,
) {
  log(`mutation removeProductMedia ${productMediaId}`, { userId });

  if (!productMediaId) throw new InvalidIdError({ productMediaId });

  const productMedia = await modules.products.media.findProductMedia({
    productMediaId,
  });
  if (!productMedia) throw new ProductMediaNotFoundError({ productMediaId });

  await modules.files.delete(productMedia.mediaId, userId);
  await modules.products.media.delete(productMediaId, userId);

  return productMedia;
}
