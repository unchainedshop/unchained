import { log } from 'meteor/unchained:core-logger';
import { Products } from 'meteor/unchained:core-products';
import { ProductNotFoundError, OrderQuantityTooLowError } from '../../errors';
import getCart from '../../getCart';

export default function(
  root,
  { orderId, items },
  { user, userId, countryContext }
) {
  /* verify existence of products */
  const itemsWithProducts = items.map(({ productId, ...item }) => {
    const product = Products.findOne({ _id: productId });
    if (!product) throw new ProductNotFoundError({ data: { productId } });
    return {
      ...item,
      product
    };
  });

  const cart = getCart({ orderId, user, countryContext });
  return itemsWithProducts.map(({ product, quantity, configuration }) => {
    if (quantity < 1)
      throw new OrderQuantityTooLowError({
        data: { quantity, productId: product._id }
      });
    log(
      `mutation addCartProduct ${product._id} ${quantity} ${
        configuration ? JSON.stringify(configuration) : ''
      }`,
      { userId, orderId }
    );
    return cart.addProductItem({ product, quantity, configuration });
  });
}
