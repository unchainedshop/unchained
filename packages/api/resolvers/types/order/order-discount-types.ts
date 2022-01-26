import { Context } from '@unchainedshop/types/api';
import { Order, OrderPricingDiscount } from '@unchainedshop/types/orders';
import { OrderDiscount as OrderDiscountType } from '@unchainedshop/types/orders.discounts';
import { OrderPrice } from '@unchainedshop/types/orders.pricing';
import crypto from 'crypto';
import { OrderDiscountDirector } from 'meteor/unchained:core-orders';

type HelperType<P, T> = (orderDiscount: OrderDiscountType, params: P, context: Context) => T;

interface OrderDiscountHelperTypes {
  interface: HelperType<
    never,
    Promise<{
      _id: string;
      label: string;
      version: string;
      isManualAdditionAllowed: boolean;
      isManualRemovalAllowed: boolean;
    }>
  >;

  discounted: HelperType<never, Promise<Array<OrderPricingDiscount>>>;
  order: HelperType<never, Promise<Order>>;
  total: HelperType<never, OrderPrice>;
}

export const OrderDiscount: OrderDiscountHelperTypes = {
  interface: async (obj) => {
    const Interface = OrderDiscountDirector.getAdapter(obj.discountKey);
    if (!Interface) return null;

    return {
      _id: Interface.key,
      label: Interface.label,
      version: Interface.version,
      isManualAdditionAllowed: await Interface.isManualAdditionAllowed(obj.code),
      isManualRemovalAllowed: await Interface.isManualRemovalAllowed(),
    };
  },

  order: async (obj, _, { modules }) => {
    return modules.orders.findOrder({ orderId: obj.orderId });
  },

  total: (obj) => {
    const { total } = obj;
    if (total) {
      return {
        _id: crypto
          .createHash('sha256')
          .update([`${obj._id}`, total.amount, total.currency].join(''))
          .digest('hex'),
        amount: total.amount,
        currency: total.currency,
      };
    }
    return null;
  },

  discounted: async (obj, _, context) => {
    const order = await context.modules.orders.findOrder({
      orderId: obj.orderId,
    });
    return context.modules.orders.discounted(order, obj, context);
  },
};
