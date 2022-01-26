import { Context, Root } from '@unchainedshop/types/api';
import { Product } from '@unchainedshop/types/products';
import { log } from 'meteor/unchained:logger';

export default async function createProduct(
  root: Root,
  { product }: { product: Product & { title: string } },
  { modules, userId, localeContext }: Context
) {
  log('mutation createProduct', { userId });

  return modules.products.create(
    {
      ...product,
      authorId: userId,
      locale: localeContext.language,
    },
    userId
  );
}
