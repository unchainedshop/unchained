import { log } from 'meteor/unchained:logger';
import { OrderDiscounts } from 'meteor/unchained:core-orders';
import {
  OrderDiscountNotFoundError,
  OrderWrongStatusError,
  InvalidIdError,
} from '../../../errors';

export default async function removeCartDiscount(root: Root, { discountId }, { modules, userId }: Context) {
  log(`mutation removeCartDiscount ${discountId}`, { userId });
  if (!discountId) throw new InvalidIdError({ discountId });
  const orderDiscount = OrderDiscounts.findDiscount({ discountId });
  if (!orderDiscount) throw new OrderDiscountNotFoundError({ orderDiscount });
  const order = orderDiscount.order();
  if (!modules.orders.isCart(order)) {
    throw new OrderWrongStatusError({ status: order.status });
  }
  return OrderDiscounts.removeDiscount({ discountId });
}
