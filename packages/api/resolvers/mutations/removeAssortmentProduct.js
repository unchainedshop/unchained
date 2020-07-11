import { log } from 'meteor/unchained:core-logger';
import { AssortmentProducts } from 'meteor/unchained:core-assortments';
import { AssortmentProductNotFoundError } from '../../errors';

export default function (root, { assortmentProductId }, { userId }) {
  log(`mutation removeAssortmentProduct ${assortmentProductId}`, { userId });
  if (!assortmentProductId)
    throw new Error('Invalid assortment product ID provided');
  const assortmentProduct = AssortmentProducts.findOne({
    _id: assortmentProductId,
  });
  if (!assortmentProduct)
    throw new AssortmentProductNotFoundError({ assortmentProductId });
  AssortmentProducts.remove({ _id: assortmentProductId });
  assortmentProduct.assortment().invalidateProductIdCache();
  return assortmentProduct;
}
