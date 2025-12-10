import type { Context } from '../../../../context.ts';
import { ProductMediaNotFoundError } from '../../../../errors.ts';
import type { Params } from '../schemas.ts';

export default async function removeProductMedia(context: Context, params: Params<'REMOVE_MEDIA'>) {
  const { modules } = context;
  const { productMediaId } = params;

  const productMedia = await modules.products.media.findProductMedia({ productMediaId });
  if (!productMedia) throw new ProductMediaNotFoundError({ productMediaId });

  await modules.files.delete(productMedia.mediaId);
  await modules.products.media.delete(productMediaId);
  return { success: true };
}
