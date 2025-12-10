import { Context } from '../../../../context.js';
import { ProductMediaNotFoundError } from '../../../../errors.js';
import { Params } from '../schemas.js';

export default async function updateProductMediaTexts(
  context: Context,
  params: Params<'UPDATE_MEDIA_TEXTS'>,
) {
  const { modules } = context;
  const { productMediaId, mediaTexts } = params;

  const media = await modules.products.media.findProductMedia({ productMediaId });
  if (!media) throw new ProductMediaNotFoundError({ productMediaId });

  const texts = await modules.products.media.texts.updateMediaTexts(productMediaId, mediaTexts);
  return { texts };
}
