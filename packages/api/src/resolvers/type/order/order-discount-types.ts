import { Context } from '../../../context.js';
import {
  Order,
  OrderPrice,
  OrderPricingDiscount,
  OrderDiscount as OrderDiscountType,
  OrderDiscountDirector,
} from '@unchainedshop/core-orders';

type HelperType<P, T> = (orderDiscount: OrderDiscountType, params: P, context: Context) => T;

export interface OrderDiscountHelperTypes {
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
  total: HelperType<never, Promise<OrderPrice>>;
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

  total: async (obj, _, context) => {
    const order = await context.modules.orders.findOrder({
      orderId: obj.orderId,
    });
    return context.modules.orders.discountTotal(order, obj, context);
  },

  discounted: async (obj, _, context) => {
    const order = await context.modules.orders.findOrder({
      orderId: obj.orderId,
    });
    return context.modules.orders.discounted(order, obj, context);
  },
};
