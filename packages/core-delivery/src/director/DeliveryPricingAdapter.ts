import {
  DeliveryPricingAdapterContext,
  DeliveryPricingCalculation,
  IDeliveryPricingSheet,
} from '@unchainedshop/types/delivery.pricing';
import { IPricingAdapter } from '@unchainedshop/types/pricing';
import { BasePricingAdapter } from 'meteor/unchained:utils';
import { DeliveryPricingSheet } from './DeliveryPricingSheet';

const basePricingAdapter = BasePricingAdapter<
  DeliveryPricingAdapterContext,
  DeliveryPricingCalculation
>();

export const DeliveryPricingAdapter: IPricingAdapter<
  DeliveryPricingAdapterContext,
  DeliveryPricingCalculation,
  IDeliveryPricingSheet
> = {
  ...basePricingAdapter,

  isActivatedFor: async (context: DeliveryPricingAdapterContext) => {
    return false;
  },

  get: ({ context, calculation }) => {
    const { currency } = context;
    const calculationSheet = DeliveryPricingSheet({ calculation, currency });
    const resultSheet = DeliveryPricingSheet({ currency });

    return {
      calculate: async () => {
        const resultRaw = resultSheet.getRawPricingSheet();
        resultRaw.forEach(({ amount, category }) =>
          basePricingAdapter.log(
            `Delivery Calculation -> ${category} ${amount}`
          )
        );
        return resultRaw;
      },
      calculationSheet,
      resultSheet,
    };
  },
};
