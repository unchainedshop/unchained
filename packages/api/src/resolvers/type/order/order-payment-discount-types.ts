import { Context } from '../../../context.js';
import { OrderPayment } from '@unchainedshop/core-orders';
import { Price, sha256 } from '@unchainedshop/utils';

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

  async total(orderDelivery: Price & { discountId: string; item: OrderPayment }) {
    return {
      _id: await sha256(
        [
          `${orderDelivery.item._id}-${orderDelivery.discountId}`,
          orderDelivery.amount,
          orderDelivery.currency,
        ].join(''),
      ),
      amount: orderDelivery.amount,
      currency: orderDelivery.currency,
    };
  },
};
