import { Context } from '../../../context.js';
import { OrderDeliveryDiscount as OrderDeliveryDiscountType } from '@unchainedshop/core-orders';

export const OrderDeliveryDiscount = {
  _id(obj: OrderDeliveryDiscountType) {
    return `${obj.item._id}:${obj.discountId}`;
  },

  orderDiscount: async (obj: OrderDeliveryDiscountType, _, { modules }: Context) => {
    // TODO: use loader
    return modules.orders.discounts.findOrderDiscount({
      discountId: obj.discountId,
    });
  },

  total(obj: OrderDeliveryDiscountType) {
    return {
      amount: obj.amount,
      currency: obj.currency,
    };
  },
};
