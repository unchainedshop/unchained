import type { Context } from '../../../context.ts';
import type { OrderPayment } from '@unchainedshop/core-orders';
import type { PriceType } from '../price-types.ts';

export const OrderPaymentDiscount = {
  _id: (orderDelivery: PriceType & { discountId: string; item: OrderPayment }) =>
    `${orderDelivery.item._id}:${orderDelivery.discountId}`,

  orderDiscount: (
    orderDelivery: PriceType & { discountId: string; item: OrderPayment },
    _,
    { modules }: Context,
  ) =>
    modules.orders.discounts.findOrderDiscount({
      discountId: orderDelivery.discountId,
    }),

  total(orderDelivery: PriceType & { discountId: string; item: OrderPayment }) {
    return {
      amount: orderDelivery.amount,
      currencyCode: orderDelivery.currencyCode,
      isTaxable: orderDelivery.isTaxable,
      isNetPrice: orderDelivery.isNetPrice,
    };
  },
};
