import { Context } from '../../../context.js';
import { OrderPositionDiscount } from '@unchainedshop/core-orders';

export const OrderItemDiscount = {
  _id: (obj: OrderPositionDiscount) => {
    return `${obj.item._id}:${obj.discountId}`;
  },

  orderDiscount: async (obj: OrderPositionDiscount, _, { modules }: Context) => {
    return modules.orders.discounts.findOrderDiscount({
      discountId: obj.discountId,
    });
  },

  total(obj: OrderPositionDiscount) {
    return {
      amount: obj.amount,
      currency: obj.currency,
    };
  },
};
