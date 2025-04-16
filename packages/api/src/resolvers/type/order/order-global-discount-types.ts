import { Order } from '@unchainedshop/core-orders';
import { Context } from '../../../context.js';
import { Price } from '@unchainedshop/utils';

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
    // TODO: use loader
    return modules.orders.discounts.findOrderDiscount({
      discountId: obj.discountId,
    });
  },

  total(
    obj: Price & {
      order: Order;
      discountId: string;
    },
  ) {
    return {
      amount: obj.amount,
      currency: obj.currency,
    };
  },
};
