import { BasePricingAdapter, IPricingAdapter, BasePricingAdapterContext } from '@unchainedshop/utils';
import { IOrderPricingSheet, OrderPricingCalculation, OrderPricingSheet } from './OrderPricingSheet.js';
import {
  Order,
  OrderDelivery,
  OrderDiscount,
  OrderPayment,
  OrderPosition,
} from '@unchainedshop/core-orders';
import { User } from '@unchainedshop/core-users';

export interface OrderPricingAdapterContext extends BasePricingAdapterContext {
  currency?: string;
  discounts: Array<OrderDiscount>;
  order: Order;
  orderDelivery: OrderDelivery;
  orderPositions: Array<OrderPosition>;
  orderPayment: OrderPayment;
  user: User;
}

export type IOrderPricingAdapter<
  UnchainedAPI = unknown,
  DiscountConfiguration = unknown,
> = IPricingAdapter<
  OrderPricingAdapterContext & UnchainedAPI,
  OrderPricingCalculation,
  IOrderPricingSheet,
  DiscountConfiguration
>;

const basePricingAdapter = BasePricingAdapter<OrderPricingAdapterContext, OrderPricingCalculation>();

export const OrderPricingAdapter: IOrderPricingAdapter = {
  ...basePricingAdapter,

  isActivatedFor: () => {
    return false;
  },

  actions: (params) => {
    const { context } = params;
    const { currency } = context;
    const baseActions = basePricingAdapter.actions(params);
    const resultSheet = OrderPricingSheet({ currency });

    return {
      ...baseActions,
      calculate: async () => {
        const resultRaw = resultSheet.getRawPricingSheet();
        resultRaw.forEach(({ amount, category }) =>
          basePricingAdapter.log(`Order Pricing Calculation -> ${category} ${amount}`),
        );
        return resultRaw;
      },
      resultSheet: () => resultSheet,
    };
  },
};
