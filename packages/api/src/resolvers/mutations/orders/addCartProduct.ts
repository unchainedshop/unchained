import { log } from '@unchainedshop/logger';
import { Context } from '../../../types.js';
import {
  ProductNotFoundError,
  OrderQuantityTooLowError,
  InvalidIdError,
  OrderWrongStatusError,
} from '../../../errors.js';
import { getOrderCart } from '../utils/getOrderCart.js';

export default async function addCartProduct(
  root: never,
  { orderId, productId, quantity, configuration },
  context: Context,
) {
  const { modules, userId, user } = context;

  log(
    `mutation addCartProduct ${productId} ${quantity} ${
      configuration ? JSON.stringify(configuration) : ''
    }`,
    { userId, orderId },
  );

  if (!productId) throw new InvalidIdError({ productId });
  if (quantity < 1) throw new OrderQuantityTooLowError({ quantity });

  const product = await modules.products.findProduct({ productId });
  if (!product) throw new ProductNotFoundError({ productId });

  const order = await getOrderCart({ orderId, user }, context);
  if (!modules.orders.isCart(order)) throw new OrderWrongStatusError({ status: order.status });

  const orderPosition = await modules.orders.positions.addProductItem(
    {
      quantity,
      configuration,
    },
    { order, product },
    context,
  );
  await modules.orders.updateCalculation(order._id, context);
  return modules.orders.positions.findOrderPosition({ itemId: orderPosition._id });
}
