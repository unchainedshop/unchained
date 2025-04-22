import {
  IOrderPricingSheet,
  OrderPricingCalculation,
  OrderPricingSheet,
  BasePricingAdapter,
  IPricingAdapter,
  BasePricingAdapterContext,
} from '../directors/index.js';
import {
  Order,
  OrderDelivery,
  OrderDiscount,
  OrderPayment,
  OrderPosition,
} from '@unchainedshop/core-orders';
import { User } from '@unchainedshop/core-users';
import { Modules } from '../modules.js';

export interface OrderPricingAdapterContext extends BasePricingAdapterContext {
  currencyCode?: string;
  discounts: Array<OrderDiscount>;
  order: Order;
  orderDelivery: OrderDelivery;
  orderPositions: Array<OrderPosition>;
  orderPayment: OrderPayment;
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
