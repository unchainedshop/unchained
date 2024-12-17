import { Order } from '@unchainedshop/core-orders';
import { Context } from '../../../context.js';
import { Price, sha256 } from '@unchainedshop/utils';

export const OrderGlobalDiscount = {
  _id(
    obj: Price & {
      order: Order;
      discountId: string;
    },
  ) {
    return `${obj.order._id}:${obj.discountId}`;
  },

  orderDiscount: async (
    obj: Price & {
      order: Order;
      discountId: string;
    },
    _,
    { modules }: Context,
  ) => {
    return modules.orders.discounts.findOrderDiscount({
      discountId: obj.discountId,
    });
  },

  async total(
    obj: Price & {
      order: Order;
      discountId: string;
    },
  ) {
    return {
      _id: await sha256([`${obj.order._id}:${obj.discountId}`, obj.amount, obj.currency].join('')),
      amount: obj.amount,
      currency: obj.currency,
    };
  },
};
