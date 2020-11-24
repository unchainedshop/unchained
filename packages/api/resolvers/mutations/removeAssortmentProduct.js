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
  const assortmentProduct = AssortmentProducts.findOne({
    _id: assortmentProductId,
  });
  if (!assortmentProduct)
    throw new AssortmentProductNotFoundError({ assortmentProductId });
  AssortmentProducts.remove({ _id: assortmentProductId });
  // TODO: Use Helper fn
  assortmentProduct.assortment().invalidateProductIdCache();
  return assortmentProduct;
}
