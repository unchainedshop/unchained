import { log } from 'meteor/unchained:core-logger';
import { AssortmentProducts } from 'meteor/unchained:core-assortments';

export default function (root, { assortmentProductId }, { userId }) {
  log(`mutation removeAssortmentProduct ${assortmentProductId}`, { userId });
  const assortmentProduct = AssortmentProducts.findOne({
    _id: assortmentProductId,
  });
  AssortmentProducts.remove({ _id: assortmentProductId });
  assortmentProduct.assortment().invalidateProductIdCache();
  return assortmentProduct;
}
