import crypto from 'crypto';
import { Context } from '@unchainedshop/api';
import { OrderDiscount } from '@unchainedshop/types/orders.discounts.js';
import { OrderPositionDiscount } from '@unchainedshop/types/orders.positions.js';
import { OrderPrice } from '@unchainedshop/types/orders.pricing.js';

type HelperType<P, T> = (orderPositionDiscount: OrderPositionDiscount, params: P, context: Context) => T;

export interface OrderItemDiscountHelperTypes {
  _id: HelperType<never, string>;
  orderDiscount: HelperType<never, Promise<OrderDiscount>>;
  total: HelperType<never, OrderPrice>;
}

export const OrderItemDiscount: OrderItemDiscountHelperTypes = {
  _id: (obj) => {
    return `${obj.item._id}:${obj.discountId}`;
  },

  orderDiscount: async (obj, _, { modules }) => {
    return modules.orders.discounts.findOrderDiscount({
      discountId: obj.discountId,
    });
  },

  total(obj) {
    return {
      _id: crypto
        .createHash('sha256')
        .update([`${obj.item._id}:${obj.discountId}`, obj.amount, obj.currency].join(''))
        .digest('hex'),
      amount: obj.amount,
      currency: obj.currency,
    };
  },
};
