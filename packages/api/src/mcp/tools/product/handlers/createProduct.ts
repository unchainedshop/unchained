import type { Context } from '../../../../context.ts';
import type { ProductText } from '@unchainedshop/core-products';
import { getNormalizedProductDetails } from '../../../utils/getNormalizedProductDetails.ts';
import type { Params } from '../schemas.ts';

export default async function createProduct(context: Context, params: Params<'CREATE'>) {
  const { modules } = context;
  const { product, texts } = params;

  const newProduct = await modules.products.create(product as any);

  if (texts && texts.length > 0) {
    await modules.products.texts.updateTexts(newProduct._id, texts as unknown as ProductText[]);
  }

  return { product: await getNormalizedProductDetails(newProduct._id, context) };
}
