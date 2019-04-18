import { log } from 'meteor/unchained:core-logger';
import { Products } from 'meteor/unchained:core-products';
import { ProductNotFoundError } from '../../errors';
import getCart from '../../getCart';

export default function(
  root,
  { orderId, productId, quantity, configuration },
  { user, userId, countryContext }
) {
  log(
    `mutation addCartProduct ${productId} ${quantity} ${
      configuration ? JSON.stringify(configuration) : ''
    }`,
    { userId, orderId }
  );
  const product = Products.findOne({ _id: productId });
  if (!product) throw new ProductNotFoundError({ data: { productId } });
  const cart = getCart({ orderId, user, countryContext });
  return cart.addProductItem({
    product,
    quantity,
    configuration
  });
}
