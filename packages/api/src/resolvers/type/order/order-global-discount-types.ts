import type { Order } from '@unchainedshop/core-orders';
import type { Context } from '../../../context.ts';
import type { Price } from '@unchainedshop/utils';

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

  total(
    obj: Price & {
      order: Order;
      discountId: string;
    },
  ) {
    return {
      amount: obj.amount,
      currencyCode: obj.currencyCode,
    };
  },
};
