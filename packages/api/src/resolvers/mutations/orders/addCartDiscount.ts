import type { Context } from '../../../context.ts';
import { log } from '@unchainedshop/logger';
import {
  OrderDiscountCodeAlreadyPresentError,
  OrderDiscountCodeNotValidError,
} from '../../../errors.ts';
import { lockCart } from '../../loadCart.ts';

export default async function addCartDiscount(
  root: never,
  { orderId, code }: { orderId?: string; code: string },
  context: Context,
) {
  const { modules, services, userId } = context;

  log(`mutation addCartDiscount ${code} ${orderId}`, { userId, orderId });

  await using order = await lockCart(context, orderId);

  // 1. check if discount code is not already used
  if (await modules.orders.discounts.isDiscountCodeUsed({ code, orderId: order._id }))
    throw new OrderDiscountCodeAlreadyPresentError({ orderId: order._id, code });

  const discount = await services.orders.createManualOrderDiscount({ order, code });
  if (!discount) throw new OrderDiscountCodeNotValidError({ code });

  await services.orders.updateCalculation(order._id);
  return discount;
}
