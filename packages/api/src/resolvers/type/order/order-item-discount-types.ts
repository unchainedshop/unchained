import { sha256 } from '@unchainedshop/utils';
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

  async total(obj: OrderPositionDiscount) {
    return {
      _id: await sha256([`${obj.item._id}:${obj.discountId}`, obj.amount, obj.currency].join('')),
      amount: obj.amount,
      currency: obj.currency,
    };
  },
};
