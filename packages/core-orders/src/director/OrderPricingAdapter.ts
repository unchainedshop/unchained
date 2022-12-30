import {
  IOrderPricingSheet,
  OrderPricingAdapterContext,
  OrderPricingCalculation,
} from '@unchainedshop/types/orders.pricing.js';
import { IPricingAdapter } from '@unchainedshop/types/pricing.js';
import { BasePricingAdapter } from '@unchainedshop/utils';
import { OrderPricingSheet } from './OrderPricingSheet.js';

const basePricingAdapter = BasePricingAdapter<OrderPricingAdapterContext, OrderPricingCalculation>();

export const OrderPricingAdapter: IPricingAdapter<
  OrderPricingAdapterContext,
  OrderPricingCalculation,
  IOrderPricingSheet
> = {
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
