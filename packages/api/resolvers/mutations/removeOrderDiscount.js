import { log } from 'meteor/unchained:core-logger';
import { OrderDiscounts, OrderStatus } from 'meteor/unchained:core-orders';
import { OrderDiscountNotFoundError, OrderWrongStatusError } from '../../errors';

export default function (root, { discountId }, { userId }) {
  log(`mutation removeOrderDiscount ${discountId}`, { userId });
  const orderDiscount = OrderDiscounts.findOne({ _id: discountId });
  if (!orderDiscount) throw new OrderDiscountNotFoundError({ data: { orderDiscount } });
  const order = orderDiscount.order();
  if (order.status !== OrderStatus.OPEN) {
    throw new OrderWrongStatusError({ data: { status: order.status } });
  }
  return OrderDiscounts.removeDiscount({ discountId });
}
