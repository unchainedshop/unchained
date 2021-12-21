import {
  IOrderPricingSheet,
  OrderPricingAdapterContext,
  OrderPricingCalculation,
} from '@unchainedshop/types/orders.pricing';
import { IPricingAdapter } from '@unchainedshop/types/pricing';
import { BasePricingAdapter } from 'meteor/unchained:utils';
import { OrderPricingSheet } from './OrderPricingSheet';

const basePricingAdapter = BasePricingAdapter<
  OrderPricingAdapterContext,
  OrderPricingCalculation
>();

export const OrderPricingAdapter: IPricingAdapter<
  OrderPricingAdapterContext,
  OrderPricingCalculation,
  IOrderPricingSheet
> = {
  ...basePricingAdapter,

  isActivatedFor: async (context: OrderPricingAdapterContext) {
    return false;
  },
  
  get: ({ context, calculation }) => {
    const { currency } = context;
    const calculationSheet = OrderPricingSheet({ calculation, currency });
    const resultSheet = OrderPricingSheet({ currency });

    return {
      calculate: async () => {
        const resultRaw = resultSheet.getRawPricingSheet();
        resultRaw.forEach(({ amount, category }) =>
          basePricingAdapter.log(
            `Order Pricing Calculation -> ${category} ${amount}`
          )
        );
        return resultRaw;
      },
      calculationSheet,
      resultSheet,
    };
  },
}
