import {
  IOrderPricingSheet,
  OrderPricingAdapterContext,
  OrderPricingCalculation,
} from '@unchainedshop/types/orders.pricing';
import { IPricingAdapter } from '@unchainedshop/types/pricing';
import { BasePricingAdapter } from 'meteor/unchained:utils';
import { OrderPricingSheet } from './OrderPricingSheet';

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
