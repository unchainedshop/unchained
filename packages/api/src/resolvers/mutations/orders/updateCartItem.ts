import { log } from '@unchainedshop/logger';
import { Context } from '../../../context.js';
import {
  OrderQuantityTooLowError,
  OrderItemNotFoundError,
  OrderWrongStatusError,
  ProductNotFoundError,
  InvalidIdError,
} from '../../../errors.js';
import { ordersSettings } from '@unchainedshop/core-orders';

export default async function updateCartItem(
  root: never,
  params: {
    itemId: string;
    quantity?: number;
    configuration?: { key: string; value: string }[];
  },
  context: Context,
) {
  const { modules, services, userId } = context;
  const { itemId, configuration = null, quantity = null } = params;

  log(`mutation updateCartItem ${itemId} ${quantity} ${JSON.stringify(configuration)}`, { userId });

  if (!itemId) throw new InvalidIdError({ itemId });

  const item = await modules.orders.positions.findOrderPosition({ itemId });
  if (!item) throw new OrderItemNotFoundError({ itemId });

  const order = await modules.orders.findOrder({ orderId: item.orderId });
  if (!modules.orders.isCart(order)) {
    throw new OrderWrongStatusError({ status: order.status });
  }

  const product = await modules.products.findProduct({
    productId: item.productId,
  });
  if (!product) throw new ProductNotFoundError({ productId: item.productId });

  if (quantity !== null && quantity < 1) throw new OrderQuantityTooLowError({ quantity });

  await ordersSettings.validateOrderPosition(
    {
      order,
      product,
      configuration,
      quantityDiff: quantity - item.quantity,
    },
    context,
  );

  const updatedOrderPosition = await modules.orders.positions.updateProductItem({
    orderPositionId: item._id,
    quantity,
    configuration,
  });
  await services.orders.updateCalculation(order._id);
  return modules.orders.positions.findOrderPosition({ itemId: updatedOrderPosition._id });
}
