import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api';
import { AssortmentProductNotFoundError, InvalidIdError } from '../../../errors';

export default async function removeAssortmentProduct(
  root: Root,
  { assortmentProductId }: { assortmentProductId: string },
  { modules, userId }: Context,
) {
  log(`mutation removeAssortmentProduct ${assortmentProductId}`, {
    userId,
  });

  if (!assortmentProductId) throw new InvalidIdError({ assortmentProductId });

  const assortmentProduct = await modules.assortments.products.findProduct({
    assortmentProductId,
  });
  if (!assortmentProduct) throw new AssortmentProductNotFoundError({ assortmentProductId });

  await modules.assortments.products.delete(assortmentProductId, { skipInvalidation: false }, userId);

  return assortmentProduct;
}
