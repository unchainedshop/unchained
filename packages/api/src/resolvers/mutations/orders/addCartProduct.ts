import { log } from '@unchainedshop/logger';
import { Context } from '../../../context.js';
import {
  ProductNotFoundError,
  OrderQuantityTooLowError,
  InvalidIdError,
  OrderWrongStatusError,
} from '../../../errors.js';
import { getOrderCart } from '../utils/getOrderCart.js';
import { ordersSettings } from '@unchainedshop/core-orders';

export default async function addCartProduct(
  root: never,
  { orderId, productId: originalProductId, quantity, configuration },
  context: Context,
) {
  const { modules, services, userId, user } = context;

  log(
    `mutation addCartProduct ${originalProductId} ${quantity} ${
      configuration ? JSON.stringify(configuration) : ''
    }`,
    { userId, orderId },
  );

  if (!originalProductId) throw new InvalidIdError({ productId: originalProductId });
  if (quantity < 1) throw new OrderQuantityTooLowError({ quantity });

  const originalProduct = await modules.products.findProduct({ productId: originalProductId });
  if (!originalProduct) throw new ProductNotFoundError({ productId: originalProductId });

  const order = await getOrderCart({ orderId, user }, context);
  if (!modules.orders.isCart(order)) throw new OrderWrongStatusError({ status: order.status });

  const product = await modules.products.resolveOrderableProduct(originalProduct, { configuration });

  // Validate add to cart mutation
  await ordersSettings.validateOrderPosition(
    {
      order,
      product,
      configuration,
      quantityDiff: quantity,
    },
    context,
  );

  const orderPosition = await modules.orders.positions.addProductItem({
    quantity,
    configuration,
    productId: product._id,
    originalProductId,
    orderId,
  });

  await services.orders.updateCalculation(order._id, context);
  return modules.orders.positions.findOrderPosition({ itemId: orderPosition._id });
}
