import { log } from 'meteor/unchained:core-logger';
import { OrderDiscounts } from 'meteor/unchained:core-orders';
import {
  OrderDiscountNotFoundError,
  OrderWrongStatusError,
  InvalidIdError,
} from '../../errors';

export default function removeCartDiscount(root, { discountId }, { userId }) {
  log(`mutation removeCartDiscount ${discountId}`, { userId });
  if (!discountId) throw new InvalidIdError({ discountId });
  const orderDiscount = OrderDiscounts.findOne({ _id: discountId });
  if (!orderDiscount) throw new OrderDiscountNotFoundError({ orderDiscount });
  const order = orderDiscount.order();
  if (!order.isCart()) {
    throw new OrderWrongStatusError({ status: order.status });
  }
  return OrderDiscounts.removeDiscount({ discountId });
}
