import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';

import {
  OrderDiscountNotFoundError,
  OrderWrongStatusError,
  InvalidIdError,
  OrderNotFoundError,
} from '../../../errors.ts';

export default async function removeCartDiscount(
  _root: never,
  { discountId }: { discountId: string },
  requestContext: Context,
) {
  const { modules, services, userId, locale } = requestContext;

  log(`mutation removeCartDiscount ${discountId}`, { userId });

  if (!discountId) throw new InvalidIdError({ discountId });

  const orderDiscount = await modules.orders.discounts.findOrderDiscount({
    discountId,
  });
  if (!orderDiscount) throw new OrderDiscountNotFoundError({ orderDiscount });

  const order = await modules.orders.findOrder({
    orderId: orderDiscount.orderId ?? undefined,
  });

  if (!order) throw new OrderNotFoundError({ orderId: orderDiscount.orderId });

  if (!modules.orders.isCart(order)) {
    throw new OrderWrongStatusError({ status: order.status });
  }

  const deletedDiscount = await services.orders.removeCartDiscount({
    order,
    orderDiscount,
    requestContext: { localeContext: locale, userId },
  });

  if (!deletedDiscount) throw new OrderDiscountNotFoundError({ orderDiscount });

  await services.orders.updateCalculation(order._id);
  return deletedDiscount;
}
