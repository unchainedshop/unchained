import {
  IPaymentPricingSheet,
  PaymentPricingAdapterContext,
  PaymentPricingCalculation,
} from '@unchainedshop/types/payment.pricing';
import { IPricingAdapter } from '@unchainedshop/types/pricing';
import { BasePricingAdapter } from 'meteor/unchained:utils';
import { PaymentPricingSheet } from './PaymentPricingSheet';

const basePricingAdapter = BasePricingAdapter<
  PaymentPricingAdapterContext,
  PaymentPricingCalculation
>();

export const PaymentPricingAdapter: IPricingAdapter<
  PaymentPricingAdapterContext,
  PaymentPricingCalculation,
  IPaymentPricingSheet
> = {
  ...basePricingAdapter,

  isActivatedFor: async (context: PaymentPricingAdapterContext) => {
    return false;
  },

  get: ({ context, calculation }) => {
    const { currency } = context.order;
    const calculationSheet = PaymentPricingSheet({ calculation, currency });
    const resultSheet = PaymentPricingSheet({ currency });

    return {
      calculate: async () => {
        const resultRaw = resultSheet.getRawPricingSheet();
        resultRaw.forEach(({ amount, category }) =>
          basePricingAdapter.log(`Payment Calculation -> ${category} ${amount}`)
        );
        return resultRaw;
      },
      calculationSheet,
      resultSheet,
    };
  },
};
