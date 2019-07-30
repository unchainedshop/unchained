import { log } from 'meteor/unchained:core-logger';
import { Products } from 'meteor/unchained:core-products';
import { ProductNotFoundError } from '../../errors';
import getCart from '../../getCart';

export default async function(
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
  return itemsWithProducts.reduce(
    async (accumulator, { product, quantity, configuration }) => {
      log(
        `mutation addCartProduct ${product._id} ${quantity} ${
          configuration ? JSON.stringify(configuration) : ''
        }`,
        { userId, orderId }
      );
      return [
        ...(await accumulator),
        ...cart.addProductItem({ product, quantity, configuration })
      ];
    },
    null
  );
}
