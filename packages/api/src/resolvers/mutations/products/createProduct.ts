import { Context, Root } from '@unchainedshop/types/api.js';
import { Product } from '@unchainedshop/types/products.js';
import { log } from '@unchainedshop/logger';

export default async function createProduct(
  root: Root,
  { product }: { product: Product & { title: string } },
  { modules, userId, localeContext }: Context,
) {
  log('mutation createProduct', { userId });

  return modules.products.create({
    ...product,
    locale: localeContext.language,
  });
}
