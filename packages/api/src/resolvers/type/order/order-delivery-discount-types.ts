import { Context } from '../../../context.js';
import { OrderDeliveryDiscount as OrderDeliveryDiscountType } from '@unchainedshop/core-orders';
import { sha256 } from '@unchainedshop/utils';

export const OrderDeliveryDiscount = {
  _id(obj: OrderDeliveryDiscountType) {
    return `${obj.item._id}:${obj.discountId}`;
  },

  orderDiscount: async (obj: OrderDeliveryDiscountType, _, { modules }: Context) => {
    return modules.orders.discounts.findOrderDiscount({
      discountId: obj.discountId,
    });
  },

  async total(obj: OrderDeliveryDiscountType) {
    return {
      _id: await sha256([`${obj.item._id}:${obj.discountId}`, obj.amount, obj.currency].join('')),
      amount: obj.amount,
      currency: obj.currency,
    };
  },
};
