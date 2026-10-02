import type { Order } from '@unchainedshop/core-orders';
import type { Context } from '../../../context.ts';
import type { PriceType } from '../price-types.ts';

export const OrderGlobalDiscount = {
  _id(
    obj: PriceType & {
      order: Order;
      discountId: string;
    },
  ) {
    return `${obj.order._id}:${obj.discountId}`;
  },

  orderDiscount: async (
    obj: PriceType & {
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
    obj: PriceType & {
      order: Order;
      discountId: string;
    },
  ) {
    return {
      amount: obj.amount,
      currencyCode: obj.currencyCode,
      isTaxable: obj.isTaxable,
      isNetPrice: obj.isNetPrice,
    };
  },
};
