import crypto from 'crypto';
import { OrderPrice } from '@unchainedshop/core-orders';
import { Order } from '@unchainedshop/core-orders';
import { OrderDiscount } from '@unchainedshop/core-orders';
import { Context } from '@unchainedshop/api';

type HelperType<P, T> = (
  orderGlobalDiscount: OrderPrice & {
    order: Order;
    discountId: string;
  },
  params: P,
  context: Context,
) => T;

export interface OrderGlobalDiscountHelperTypes {
  _id: HelperType<never, string>;
  orderDiscount: HelperType<never, Promise<OrderDiscount>>;
  total: HelperType<never, OrderPrice>;
}

export const OrderGlobalDiscount: OrderGlobalDiscountHelperTypes = {
  _id(obj) {
    return `${obj.order._id}:${obj.discountId}`;
  },

  orderDiscount: async (obj, _, { modules }) => {
    return modules.orders.discounts.findOrderDiscount({
      discountId: obj.discountId,
    });
  },

  total: (obj) => {
    return {
      _id: crypto
        .createHash('sha256')
        .update([`${obj.order._id}:${obj.discountId}`, obj.amount, obj.currency].join(''))
        .digest('hex'),
      amount: obj.amount,
      currency: obj.currency,
    };
  },
};
