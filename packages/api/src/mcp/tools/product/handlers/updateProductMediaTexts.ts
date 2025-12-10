import type { Context } from '../../../../context.ts';
import { ProductMediaNotFoundError } from '../../../../errors.ts';
import type { Params } from '../schemas.ts';

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
