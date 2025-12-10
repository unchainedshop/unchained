import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';
import { ProductMediaNotFoundError, InvalidIdError } from '../../../errors.ts';

export default async function removeProductMedia(
  root: never,
  { productMediaId }: { productMediaId: string },
  { modules, userId }: Context,
) {
  log(`mutation removeProductMedia ${productMediaId}`, { userId });

  if (!productMediaId) throw new InvalidIdError({ productMediaId });

  const productMedia = await modules.products.media.findProductMedia({
    productMediaId,
  });
  if (!productMedia) throw new ProductMediaNotFoundError({ productMediaId });

  await modules.files.delete(productMedia.mediaId);
  await modules.products.media.delete(productMediaId);

  return productMedia;
}
