import { log } from 'meteor/unchained:core-logger';
import { AssortmentProducts } from 'meteor/unchained:core-assortments';
import { AssortmentProductNotFoundError, InvalidIdError } from '../../errors';

export default function removeAssortmentProduct(
  root,
  { assortmentProductId },
  { userId }
) {
  log(`mutation removeAssortmentProduct ${assortmentProductId}`, { userId });
  if (!assortmentProductId) throw new InvalidIdError({ assortmentProductId });
  const assortmentProduct = AssortmentProducts.findProduct({
    assortmentProductId,
  });
  if (!assortmentProduct)
    throw new AssortmentProductNotFoundError({ assortmentProductId });
  return assortmentProduct.removeAssortmentProduct();
}
