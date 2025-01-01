import { log } from '@unchainedshop/logger';
import { AssortmentProductNotFoundError, InvalidIdError } from '../../../errors.js';
import { Context } from '../../../context.js';

export default async function removeAssortmentProduct(
  root: never,
  { assortmentProductId }: { assortmentProductId: string },
  { modules, userId }: Context,
) {
  log(`mutation removeAssortmentProduct ${assortmentProductId}`, {
    userId,
  });

  if (!assortmentProductId) throw new InvalidIdError({ assortmentProductId });

  const assortmentProduct = await modules.assortments.products.findAssortmentProduct({
    assortmentProductId,
  });
  if (!assortmentProduct) throw new AssortmentProductNotFoundError({ assortmentProductId });

  await modules.assortments.products.delete(assortmentProductId);

  return assortmentProduct;
}
