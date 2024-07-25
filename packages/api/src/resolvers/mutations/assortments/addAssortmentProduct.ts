import { log } from '@unchainedshop/logger';
import { AssortmentProduct } from '@unchainedshop/types/assortments.js';
import { AssortmentNotFoundError, ProductNotFoundError, InvalidIdError } from '../../../errors.js';
import { Context } from '../../../types.js';

export default async function addAssortmentProduct(
  root: never,
  { assortmentId, productId, ...assortmentProduct }: AssortmentProduct,
  { modules, userId }: Context,
) {
  log(`mutation addAssortmentProduct ${assortmentId} -> ${productId}`, {
    userId,
  });

  if (!assortmentId) throw new InvalidIdError({ assortmentId });
  if (!productId) throw new InvalidIdError({ productId });

  if (!(await modules.assortments.assortmentExists({ assortmentId })))
    throw new AssortmentNotFoundError({
      assortmentId,
    });

  if (!(await modules.products.productExists({ productId })))
    throw new ProductNotFoundError({ productId });

  return modules.assortments.products.create({
    assortmentId,
    productId,
    ...assortmentProduct,
  });
}
