import { Context, Root } from '@unchainedshop/types/api.js';
import { Product, ProductText } from '@unchainedshop/types/products.js';
import { log } from '@unchainedshop/logger';

export default async function createProduct(
  root: Root,
  { productData, texts }: { productData: Product; texts?: ProductText[] },
  { modules, userId }: Context,
) {
  log('mutation createProduct', { userId });

  const newProduct = await modules.products.create(productData);

  if (texts) {
    await modules.products.texts.updateTexts(newProduct._id, texts);
  }

  return newProduct;
}
