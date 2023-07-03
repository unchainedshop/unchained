import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api.js';
import { AssortmentProduct } from '@unchainedshop/types/assortments.js';
import { AssortmentNotFoundError, ProductNotFoundError, InvalidIdError } from '../../../errors.js';

export default async function addAssortmentProduct(
  root: Root,
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
