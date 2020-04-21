import { log } from 'meteor/unchained:core-logger';
import { Products } from 'meteor/unchained:core-products';
import { ProductNotFoundError, OrderQuantityTooLowError } from '../../errors';
import getCart from '../../getCart';

export default async function (
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
  if (quantity < 1) throw new OrderQuantityTooLowError({ quantity });
  const product = Products.findOne({ _id: productId });
  if (!product) throw new ProductNotFoundError({ productId });
  const cart = await getCart({ orderId, user, countryContext });
  return cart.addProductItem({
    product,
    quantity,
    configuration,
  });
}
