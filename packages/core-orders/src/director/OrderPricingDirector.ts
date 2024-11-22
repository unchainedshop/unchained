import { BasePricingDirector, PricingDiscount, IPricingDirector } from '@unchainedshop/utils';
import { IOrderPricingSheet, OrderPricingCalculation, OrderPricingSheet } from './OrderPricingSheet.js';
import { Order, OrderDelivery, OrderPayment, OrderPosition } from '../types.js';
import {
  IOrderPricingAdapter,
  OrderPricingAdapterContext,
  OrderPricingContext,
} from './OrderPricingAdapter.js';

export type OrderPrice = { _id?: string; amount: number; currency: string };

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
  IOrderPricingAdapter<any, DiscountConfiguration>
>;

const baseDirector = BasePricingDirector<
  OrderPricingContext,
  OrderPricingAdapterContext,
  OrderPricingCalculation,
  IOrderPricingAdapter
>('OrderPricingDirector');

export const OrderPricingDirector: IOrderPricingDirector = {
  ...baseDirector,

  buildPricingContext: async (context, unchainedAPI) => {
    const { modules } = unchainedAPI;
    const { order } = context;

    const user = await modules.users.findUserById(order.userId);
    const discounts = await modules.orders.discounts.findOrderDiscounts({
      orderId: order._id,
    });

    return {
      ...unchainedAPI,
      country: order.countryCode,
      currency: order.currency,
      discounts,
      order,
      orderDelivery: context.orderDelivery,
      orderPayment: context.orderPayment,
      orderPositions: context.orderPositions,
      user,
    };
  },

  async actions(pricingContext, unchainedAPI) {
    const actions = await baseDirector.actions(pricingContext, unchainedAPI, this.buildPricingContext);
    return {
      ...actions,
      calculationSheet() {
        const context = actions.getContext();
        return OrderPricingSheet({
          calculation: actions.getCalculation(),
          currency: context.currency,
        });
      },
    };
  },
};
