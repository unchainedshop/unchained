import { Context, Root } from '@unchainedshop/types/api';
import { log } from '@unchainedshop/logger';
import { InvalidIdError } from '../../../errors';

export default async function product(
  root: Root,
  { productId, slug }: { productId?: string; slug?: string },
  { modules, userId }: Context,
) {
  log(`query product ${productId || slug}`, { userId });

  if (!productId === !slug) throw new InvalidIdError({ productId, slug });

  return modules.products.findProduct({ productId, slug });
}
