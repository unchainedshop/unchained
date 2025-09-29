import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import {
  OrderWrongStatusError,
  OrderDiscountCodeAlreadyPresentError,
  OrderDiscountCodeNotValidError,
  OrderNotFoundError,
} from '../../../errors.js';

export default async function addCartDiscount(
  root: never,
  { orderId, code }: { orderId?: string; code: string },
  context: Context,
) {
  const { modules, services, user, userId } = context;

  log(`mutation addCartDiscount ${code} ${orderId}`, { userId, orderId });

  const order = await services.orders.findOrInitCart({
    orderId,
    user: user!,
    countryCode: context.countryCode,
  });
  if (!order) throw new OrderNotFoundError({ orderId });

  if (!modules.orders.isCart(order)) throw new OrderWrongStatusError({ status: order.status });

  // 1. check if discount code is not already used
  if (await modules.orders.discounts.isDiscountCodeUsed({ code, orderId: order._id }))
    throw new OrderDiscountCodeAlreadyPresentError({ orderId: order._id, code });

  const discount = await services.orders.createManualOrderDiscount({ order, code });
  if (!discount) throw new OrderDiscountCodeNotValidError({ code });

  await services.orders.updateCalculation(order._id);
  return discount;
}
