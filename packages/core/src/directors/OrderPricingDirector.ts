import {
  IOrderPricingSheet,
  OrderPricingCalculation,
  OrderPricingSheet,
  IOrderPricingAdapter,
  OrderPricingAdapterContext,
  BasePricingDirector,
  PricingDiscount,
  IPricingDirector,
} from '../directors/index.js';
import { Order, OrderDelivery, OrderPayment, OrderPosition } from '@unchainedshop/core-orders';

export interface OrderPricingContext {
  currency: string;
  order: Order;
  orderDelivery: OrderDelivery;
  orderPositions: Array<OrderPosition>;
  orderPayment: OrderPayment;
}

export type OrderPricingDiscount = PricingDiscount & {
  delivery?: OrderDelivery;
  item?: OrderPosition;
  order?: Order;
  payment?: OrderPayment;
};

export type IOrderPricingDirector<
  UnchainedAPI = unknown,
  DiscountConfiguration = unknown,
> = IPricingDirector<
  OrderPricingContext,
  OrderPricingCalculation,
  OrderPricingAdapterContext,
  IOrderPricingSheet,
  IOrderPricingAdapter<any, DiscountConfiguration>,
  UnchainedAPI
>;

const baseDirector = BasePricingDirector<
  OrderPricingContext,
  OrderPricingAdapterContext,
  OrderPricingCalculation,
  IOrderPricingAdapter
>('OrderPricingDirector');

export const OrderPricingDirector: IOrderPricingDirector<any> = {
  ...baseDirector,

  buildPricingContext: async (context, unchainedAPI) => {
    const { modules } = unchainedAPI;
    const { order, currency } = context;

    const user = await modules.users.findUserById(order.userId);
    const discounts = await modules.orders.discounts.findOrderDiscounts({
      orderId: order._id,
    });

    return {
      ...unchainedAPI,
      country: order.countryCode,
      currency,
      discounts,
      order,
      orderDelivery: context.orderDelivery,
      orderPayment: context.orderPayment,
      orderPositions: context.orderPositions,
      user,
    };
  },

  calculationSheet(pricingContext, calculation) {
    return OrderPricingSheet({
      calculation,
      currency: pricingContext.currency,
    });
  },
};
