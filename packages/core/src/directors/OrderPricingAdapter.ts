import {
  type IOrderPricingSheet,
  type OrderPricingCalculation,
  OrderPricingSheet,
  BasePricingAdapter,
  type IPricingAdapter,
  type BasePricingAdapterContext,
} from '../directors/index.ts';
import type {
  Order,
  OrderDelivery,
  OrderDiscount,
  OrderPayment,
  OrderPosition,
} from '@unchainedshop/core-orders';
import type { User } from '@unchainedshop/core-users';
import type { Modules } from '../modules.ts';

export interface OrderPricingAdapterContext extends BasePricingAdapterContext {
  currencyCode?: string;
  discounts: OrderDiscount[];
  order: Order;
  orderPositions: OrderPosition[];
  orderDelivery: OrderDelivery | null;
  orderPayment: OrderPayment | null;
  user: User;
}

export type IOrderPricingAdapter<DiscountConfiguration = unknown> = IPricingAdapter<
  OrderPricingAdapterContext & { modules: Modules },
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
    const { currencyCode } = context;
    const baseActions = basePricingAdapter.actions(params);
    const resultSheet = OrderPricingSheet({ currencyCode });

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
