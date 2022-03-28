import {
  DeliveryPricingAdapterContext,
  DeliveryPricingCalculation,
  IDeliveryPricingAdapter,
} from '@unchainedshop/types/delivery.pricing';
import { BasePricingAdapter } from 'meteor/unchained:utils';
import { DeliveryPricingSheet } from './DeliveryPricingSheet';

const basePricingAdapter = BasePricingAdapter<
  DeliveryPricingAdapterContext,
  DeliveryPricingCalculation
>();

export const DeliveryPricingAdapter: IDeliveryPricingAdapter = {
  ...basePricingAdapter,

  isActivatedFor: () => {
    return false;
  },

  actions: (params) => {
    const { context, calculation } = params;
    const { currency } = context;
    const calculationSheet = DeliveryPricingSheet({ calculation, currency });
    const resultSheet = DeliveryPricingSheet({ currency });

    return {
      ...basePricingAdapter.actions(params),
      calculate: async () => {
        const resultRaw = resultSheet.getRawPricingSheet();
        resultRaw.forEach(({ amount, category }) =>
          basePricingAdapter.log(`Delivery Calculation -> ${category} ${amount}`),
        );
        return resultRaw;
      },
      calculationSheet: () => calculationSheet,
      resultSheet: () => resultSheet,
    };
  },
};
