import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { InvalidIdError } from '../../../errors.js';

export default async function product(
  root: never,
  { productId, slug }: { productId?: string; slug?: string },
  { modules, userId }: Context,
) {
  log(`query product ${productId || slug}`, { userId });

  if (!productId === !slug) throw new InvalidIdError({ productId, slug });

  return modules.products.findProduct({ productId, slug: slug! });
}
