import type { Context } from '../../../context.ts';
import type { OrderPayment } from '@unchainedshop/core-orders';
import type { Price } from '@unchainedshop/utils';

export const OrderPaymentDiscount = {
  _id: (orderDelivery: Price & { discountId: string; item: OrderPayment }) =>
    `${orderDelivery.item._id}:${orderDelivery.discountId}`,

  orderDiscount: (
    orderDelivery: Price & { discountId: string; item: OrderPayment },
    _,
    { modules }: Context,
  ) =>
    modules.orders.discounts.findOrderDiscount({
      discountId: orderDelivery.discountId,
    }),

  total(orderDelivery: Price & { discountId: string; item: OrderPayment }) {
    return {
      amount: orderDelivery.amount,
      currencyCode: orderDelivery.currencyCode,
    };
  },
};
