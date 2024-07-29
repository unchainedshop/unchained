import crypto from 'crypto';
import { Context } from '@unchainedshop/api';
import { OrderDiscount } from '@unchainedshop/core-orders';
import { OrderPayment } from '@unchainedshop/core-orders';
import { OrderPrice } from '@unchainedshop/core-orders';

type HelperType<P, T> = (
  orderDelivery: OrderPrice & { discountId: string; item: OrderPayment },
  params: P,
  context: Context,
) => T;

export interface OrderPaymentDiscountHelperTypes {
  _id: HelperType<never, string>;
  orderDiscount: HelperType<never, Promise<OrderDiscount>>;
  total: HelperType<never, OrderPrice>;
}

export const OrderPaymentDiscount: OrderPaymentDiscountHelperTypes = {
  _id: (obj) => `${obj.item._id}:${obj.discountId}`,

  orderDiscount: (obj, _, { modules }) =>
    modules.orders.discounts.findOrderDiscount({
      discountId: obj.discountId,
    }),

  total: (obj) => ({
    _id: crypto
      .createHash('sha256')
      .update([`${obj.item._id}-${obj.discountId}`, obj.amount, obj.currency].join(''))
      .digest('hex'),
    amount: obj.amount,
    currency: obj.currency,
  }),
};
