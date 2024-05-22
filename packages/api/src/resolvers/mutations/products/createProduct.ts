import { Context, Root } from '@unchainedshop/types/api.js';
import { Product, ProductText } from '@unchainedshop/types/products.js';
import { log } from '@unchainedshop/logger';

export default async function createProduct(
  root: Root,
  { product }: { product: Product & { texts: ProductText[] } },
  { modules, userId }: Context,
) {
  log('mutation createProduct', { userId });

  return modules.products.create({
    ...product,
  });
}
