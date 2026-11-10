import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';

import { OrderDiscountNotFoundError, InvalidIdError } from '../../../errors.ts';
import { lockCart } from '../../loadCart.ts';

export default async function removeCartDiscount(
  _root: never,
  { discountId }: { discountId: string },
  requestContext: Context,
) {
  const { modules, services, userId, locale } = requestContext;

  log(`mutation removeCartDiscount ${discountId}`, { userId });

  if (!discountId) throw new InvalidIdError({ discountId });

  const discount = await modules.orders.discounts.findOrderDiscount({ discountId });
  if (!discount) throw new OrderDiscountNotFoundError({ discountId });

  await using order = await lockCart(requestContext, discount.orderId);
  const orderDiscount = await modules.orders.discounts.findOrderDiscount({ discountId });
  if (orderDiscount?.orderId !== order._id) throw new OrderDiscountNotFoundError({ discountId });

  const deletedDiscount = await services.orders.removeCartDiscount({
    order,
    orderDiscount,
    requestContext: { localeContext: locale, userId },
  });

  if (!deletedDiscount) throw new OrderDiscountNotFoundError({ discountId });

  await services.orders.updateCalculation(order._id);
  return deletedDiscount;
}
