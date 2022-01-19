import { Context } from '@unchainedshop/types/api';
import { OrderDelivery } from '@unchainedshop/types/orders.deliveries';
import { OrderDiscount } from '@unchainedshop/types/orders.discounts';
import { OrderPayment } from '@unchainedshop/types/orders.payments';
import { OrderPrice } from '@unchainedshop/types/orders.pricing';
import crypto from 'crypto';

type HelperType<P, T> = (
  orderDelivery: OrderPrice & { discountId: string; item: OrderPayment },
  params: P,
  context: Context
) => T;

interface OrderPaymentDiscountHelperTypes {
  _id: HelperType<never, string>;
  orderDiscount: HelperType<never, Promise<OrderDiscount>>;
  total: HelperType<never, OrderPrice>;
}

export const OrderPaymentDiscount: OrderPaymentDiscountHelperTypes = {
  _id(obj) {
    return `${obj.item._id}:${obj.discountId}`;
  },

  async orderDiscount(obj, _, { modules }) {
    return await modules.orders.discounts.findOrderDiscount({
      discountId: obj.discountId,
    });
  },

  total(obj) {
    return {
      _id: crypto
        .createHash('sha256')
        .update(
          [`${obj.item._id}-${obj.discountId}`, obj.amount, obj.currency].join(
            ''
          )
        )
        .digest('hex'),
      amount: obj.amount,
      currency: obj.currency,
    };
  },
};
