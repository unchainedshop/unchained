import { Context } from '@unchainedshop/types/api';
import {
  OrderPosition,
  OrderPositionDiscount,
} from '@unchainedshop/types/orders.positions';
import { OrderPrice } from '@unchainedshop/types/orders.pricing';
import crypto from 'crypto';

type HelperType<P, T> = (
  orderPosition: OrderPosition,
  params: P,
  context: Context
) => T;

interface OrderItemHelperTypes {
  total: HelperType<{ category: string }, Promise<OrderPrice>>;
  unitPrice: HelperType<never, Promise<OrderPrice>>;
  discounts: HelperType<never, Promise<Array<OrderPositionDiscount>>>;
}

export const OrderItem: OrderItemHelperTypes = {
  total: async (obj, { category }, { modules }) => {
    const order = await modules.orders.findOrder({ orderId: obj.orderId });
    const pricingSheet = modules.orders.positions.pricingSheet(obj, {
      currency: order.currency,
    });
    if (pricingSheet.isValid()) {
      const { amount, currency } = pricingSheet.total({
        category,
        useNetPrice: false,
      });
      return {
        _id: crypto
          .createHash('sha256')
          .update([`${obj._id}-${category}`, amount, currency].join(''))
          .digest('hex'),
        amount,
        currency,
      };
    }
    return null;
  },

  unitPrice: async (obj, _, { modules }) => {
    const order = await modules.orders.findOrder({ orderId: obj.orderId });
    const pricingSheet = modules.orders.positions.pricingSheet(obj, {
      currency: order.currency,
    });
    if (pricingSheet.isValid()) {
      const { amount, currency } = pricingSheet.unitPrice({
        useNetPrice: false,
      });
      return {
        _id: crypto
          .createHash('sha256')
          .update([`${obj._id}-unit`, amount, currency].join(''))
          .digest('hex'),
        amount,
        currency,
      };
    }
    return null;
  },

  discounts: async (obj, _, { modules }) => {
    const order = await modules.orders.findOrder({ orderId: obj.orderId });
    const pricingSheet = modules.orders.positions.pricingSheet(obj, {
      currency: order.currency,
    });
    if (pricingSheet.isValid()) {
      // IMPORTANT: Do not send any parameter to obj.discounts!
      return pricingSheet.discountPrices().map((discount) => ({
        item: obj,
        ...discount,
      }));
    }
    return [];
  },
};
