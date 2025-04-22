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
  currencyCode: string;
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
      user,
    };
  },

  calculationSheet(pricingContext, calculation) {
    return OrderPricingSheet({
      calculation,
      currencyCode: pricingContext.currencyCode,
    });
  },
};
