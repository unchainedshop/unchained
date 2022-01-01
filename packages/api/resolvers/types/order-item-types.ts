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
  total: HelperType<{ category: string }, OrderPrice>;
  unitPrice: HelperType<never, OrderPrice>;
  discounts: HelperType<never, Array<OrderPositionDiscount>>;
}

export const OrderItem: OrderItemHelperTypes = {
  total: (obj, { category }, { modules }) => {
    const pricingSheet = modules.orders.positions.pricingSheet(obj);
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

  unitPrice: (obj, _, { modules }) => {
    const pricingSheet = modules.orders.positions.pricingSheet(obj);
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

  discounts: (obj, _, { modules }) => {
    const pricingSheet = modules.orders.positions.pricingSheet(obj);
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
