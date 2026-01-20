import {
  type IOrderPricingSheet,
  type OrderPricingCalculation,
  OrderPricingSheet,
} from './OrderPricingSheet.ts';
import {
  type IOrderPricingAdapter,
  type OrderPricingAdapterContext,
  OrderPricingAdapter,
} from './OrderPricingAdapter.ts';
import { BasePricingDirector, type IPricingDirector } from './BasePricingDirector.ts';
import type { PricingDiscount } from './BasePricingSheet.ts';
import type { Order, OrderDelivery, OrderPayment, OrderPosition } from '@unchainedshop/core-orders';
import { pluginRegistry } from '../plugins/PluginRegistry.ts';
export interface OrderPricingContext {
  currencyCode: string;
  order: Order;
  orderDelivery: OrderDelivery | null;
  orderPositions: OrderPosition[];
  orderPayment: OrderPayment | null;
}

export type OrderPricingDiscount = PricingDiscount & {
  delivery?: OrderDelivery;
  item?: OrderPosition;
  order?: Order;
  payment?: OrderPayment;
};

export type IOrderPricingDirector<DiscountConfiguration = unknown> = IPricingDirector<
  OrderPricingContext,
  OrderPricingCalculation,
  OrderPricingAdapterContext,
  IOrderPricingSheet,
  IOrderPricingAdapter<DiscountConfiguration>
>;

const baseDirector = BasePricingDirector<
  OrderPricingContext,
  OrderPricingAdapterContext,
  OrderPricingCalculation,
  IOrderPricingAdapter
>('OrderPricingDirector');

export const OrderPricingDirector: IOrderPricingDirector<any> = {
  ...baseDirector,

  // Override to query pluginRegistry dynamically
  getAdapter: (key: string) => {
    const adapters = pluginRegistry.getAdapters(
      OrderPricingAdapter.adapterType!,
    ) as IOrderPricingAdapter[];
    return adapters.find((adapter) => adapter.key === key) || null;
  },

  // Override to query pluginRegistry dynamically
  getAdapters: ({ adapterFilter } = {}) => {
    const adapters = pluginRegistry.getAdapters(
      OrderPricingAdapter.adapterType!,
    ) as IOrderPricingAdapter[];
    return adapters.filter(adapterFilter || (() => true));
  },

  buildPricingContext: async (context, unchainedAPI) => {
    const { modules } = unchainedAPI;
    const { order, currencyCode } = context;

    const user = await modules.users.findUserById(order.userId);
    const discounts = await modules.orders.discounts.findOrderDiscounts({
      orderId: order._id,
    });

    return {
      ...unchainedAPI,
      countryCode: order.countryCode,
      currencyCode,
      discounts,
      order,
      orderDelivery: context.orderDelivery,
      orderPayment: context.orderPayment,
      orderPositions: context.orderPositions,
      user: user!,
    };
  },

  calculationSheet(pricingContext, calculation) {
    return OrderPricingSheet({
      calculation,
      currencyCode: pricingContext.currencyCode,
    });
  },
};
