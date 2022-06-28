import {
  DeliveryPricingAdapterContext,
  DeliveryPricingCalculation,
  IDeliveryPricingAdapter,
} from '@unchainedshop/types/delivery.pricing';
import { BasePricingAdapter } from '@unchainedshop/utils';
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
    const { context } = params;
    const { currency } = context;
    const baseActions = basePricingAdapter.actions(params);
    const resultSheet = DeliveryPricingSheet({ currency });

    return {
      ...baseActions,
      calculate: async () => {
        const resultRaw = resultSheet.getRawPricingSheet();
        resultRaw.forEach(({ amount, category }) =>
          basePricingAdapter.log(`Delivery Calculation -> ${category} ${amount}`),
        );
        return resultRaw;
      },
      resultSheet: () => resultSheet,
    };
  },
};
