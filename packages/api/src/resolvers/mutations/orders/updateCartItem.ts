import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';
import {
  OrderQuantityTooLowError,
  OrderItemNotFoundError,
  OrderWrongStatusError,
  ProductNotFoundError,
  InvalidIdError,
  OrderNotFoundError,
  QuotationNotFoundError,
  QuotationItemConfigurationError,
  rethrowAs,
} from '../../../errors.ts';

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
  const { itemId, configuration, quantity } = params;

  log(`mutation updateCartItem ${itemId} ${quantity} ${JSON.stringify(configuration)}`, { userId });

  if (!itemId) throw new InvalidIdError({ itemId });

  const item = await modules.orders.positions.findOrderPosition({ itemId });
  if (!item) throw new OrderItemNotFoundError({ itemId });

  const order = await modules.orders.findOrder({ orderId: item.orderId });

  if (!order) throw new OrderNotFoundError({ orderId: item.orderId });

  if (!modules.orders.isCart(order)) {
    throw new OrderWrongStatusError({ status: order.status });
  }

  if (quantity != null && quantity < 1) throw new OrderQuantityTooLowError({ quantity });

  await services.orders
    .updateCartItem({ order, item, quantity, configuration }, context)
    .catch(rethrowAs({ ProductNotFoundError, QuotationNotFoundError, QuotationItemConfigurationError }));

  await services.orders.updateCalculation(order._id);
  return modules.orders.positions.findOrderPosition({ itemId: item._id });
}
