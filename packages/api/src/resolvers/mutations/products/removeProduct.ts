import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api';
import { ProductNotFoundError, InvalidIdError } from '../../../errors';

export default async function removeProduct(
  root: Root,
  { productId }: { productId: string },
  context: Context,
) {
  const { modules, services, userId } = context;
  log(`mutation removeProduct ${productId}`, { userId });

  if (!productId) throw new InvalidIdError({ productId });

  if (!(await modules.products.productExists({ productId })))
    throw new ProductNotFoundError({ productId });

  await services.products.removeProduct({ productId, userId: context.userId }, context);

  return modules.products.findProduct({ productId });
}
