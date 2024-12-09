import { log } from '@unchainedshop/logger';
import { Context } from '../../../context.js';

import { OrderDiscountNotFoundError, OrderWrongStatusError, InvalidIdError } from '../../../errors.js';
import { OrderDiscountTrigger } from '@unchainedshop/core-orders';
import { OrderDiscountDirector } from '@unchainedshop/core';

export default async function removeCartDiscount(
  root: never,
  { discountId }: { discountId: string },
  requestContext: Context,
) {
  const { modules, services, userId } = requestContext;

  log(`mutation removeCartDiscount ${discountId}`, { userId });

  if (!discountId) throw new InvalidIdError({ discountId });

  const orderDiscount = await modules.orders.discounts.findOrderDiscount({
    discountId,
  });
  if (!orderDiscount) throw new OrderDiscountNotFoundError({ orderDiscount });

  const order = await modules.orders.findOrder({
    orderId: orderDiscount.orderId,
  });
  if (!modules.orders.isCart(order)) {
    throw new OrderWrongStatusError({ status: order.status });
  }

  if (orderDiscount.trigger === OrderDiscountTrigger.USER) {
    // Release
    const Adapter = OrderDiscountDirector.getAdapter(orderDiscount.discountKey);
    if (Adapter) {
      const adapter = await Adapter.actions({
        context: { order, orderDiscount, code: orderDiscount.code, ...requestContext },
      });
      await adapter.release();
    }
  }

  const deletedDiscount = await modules.orders.discounts.delete(discountId);
  await services.orders.updateCalculation(order._id, requestContext);
  return deletedDiscount;
}
