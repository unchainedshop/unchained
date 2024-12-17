import { Price } from '@unchainedshop/utils';
import { Context } from '../../../context.js';
import { Order, OrderDiscount as OrderDiscountType } from '@unchainedshop/core-orders';
import { OrderDiscountDirector, OrderPricingDiscount } from '@unchainedshop/core';

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
  total: HelperType<never, Promise<Price>>;
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
    return context.services.orders.calculateDiscountTotal(order, obj);
  },

  discounted: async (obj, _, context) => {
    const order = await context.modules.orders.findOrder({
      orderId: obj.orderId,
    });
    return context.services.orders.discountedEntities(order, obj);
  },
};
