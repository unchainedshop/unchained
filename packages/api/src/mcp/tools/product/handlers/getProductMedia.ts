import { Context } from '../../../../context.js';
import { ProductNotFoundError } from '../../../../errors.js';
import normalizeMediaUrl from '../../../utils/normalizeMediaUrl.js';
import { Params } from '../schemas.js';

export default async function getProductMedia(context: Context, params: Params<'GET_MEDIA'>) {
  const { modules } = context;
  const { productId, tags, limit = 50, offset = 0 } = params;
  const product = await modules.products.findProduct({ productId });
  if (!product) throw new ProductNotFoundError({ productId });

  const media = await modules.products.media.findProductMedias({
    productId,
    tags,
    limit,
    offset,
  });
  return { media: await normalizeMediaUrl(media, context) };
}
