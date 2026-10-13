import type { Context } from '../../../context.ts';
import { OrderNotFoundError, OrderWrongStatusError } from '../../../errors.ts';

export default async function loadCart(context: Context, orderId?: string) {
  const { modules, services, user, countryCode } = context;
  const order = await services.orders.findOrInitCart({ orderId, user: user!, countryCode });
  if (!order) throw new OrderNotFoundError({ orderId });
  if (!modules.orders.isCart(order)) throw new OrderWrongStatusError({ status: order.status });
  return order;
}
