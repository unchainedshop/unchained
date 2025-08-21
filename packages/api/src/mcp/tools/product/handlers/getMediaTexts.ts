import { Context } from '../../../../context.js';
import { ProductMediaNotFoundError } from '../../../../errors.js';
import { Params } from '../schemas.js';

export default async function getMediaTexts(context: Context, params: Params<'GET_MEDIA_TEXTS'>) {
  const { modules } = context;
  const { productMediaId } = params;

  const media = await modules.products.media.findProductMedia({ productMediaId });
  if (!media) throw new ProductMediaNotFoundError({ productMediaId });

  const texts = await modules.products.media.texts.findMediaTexts({ productMediaId });
  return { texts };
}
