import type { Context } from '../../../context.ts';
import type { Product, ProductText } from '@unchainedshop/core-products';
import { log } from '@unchainedshop/logger';

export default async function createProduct(
  root: never,
  { product: productData, texts }: { product: Product; texts?: ProductText[] },
  { modules, userId }: Context,
) {
  log('mutation createProduct', { userId });
  const newProduct = await modules.products.create(productData);

  if (texts) {
    await modules.products.texts.updateTexts(newProduct._id, texts);
  }

  return newProduct;
}
