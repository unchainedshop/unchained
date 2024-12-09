import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { getOrderCart } from '../utils/getOrderCart.js';
import {
  OrderWrongStatusError,
  OrderDiscountCodeAlreadyPresentError,
  OrderDiscountCodeNotValidError,
} from '../../../errors.js';

export default async function addCartDiscount(
  root: never,
  { orderId, code }: { orderId?: string; code: string },
  context: Context,
) {
  const { modules, services, user, userId } = context;

  log(`mutation addCartDiscount ${code} ${orderId}`, { userId, orderId });

  const order = await getOrderCart({ orderId, user }, context);

  if (!modules.orders.isCart(order)) throw new OrderWrongStatusError({ status: order.status });

  // 1. check if discount code is not already used
  if (await modules.orders.discounts.isDiscountCodeUsed({ code, orderId }))
    throw new OrderDiscountCodeAlreadyPresentError({ orderId, code });

  const discount = await services.orders.createManualOrderDiscount({ order, code }, context);
  if (!discount) throw new OrderDiscountCodeNotValidError({ code });

  await services.orders.updateCalculation(order._id, context);
  return discount;
}
