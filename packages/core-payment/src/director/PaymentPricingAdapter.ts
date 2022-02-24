import {
  IPaymentPricingSheet,
  PaymentPricingAdapterContext,
  PaymentPricingCalculation,
} from '@unchainedshop/types/payments.pricing';
import { IPricingAdapter } from '@unchainedshop/types/pricing';
import { BasePricingAdapter } from 'meteor/unchained:utils';
import { PaymentPricingSheet } from './PaymentPricingSheet';

const basePricingAdapter = BasePricingAdapter<PaymentPricingAdapterContext, PaymentPricingCalculation>();

export const PaymentPricingAdapter: IPricingAdapter<
  PaymentPricingAdapterContext,
  PaymentPricingCalculation,
  IPaymentPricingSheet
> = {
  ...basePricingAdapter,

  isActivatedFor: () => {
    return false;
  },

  actions: ({ context, calculation }) => {
    const { currency } = context.order;
    const calculationSheet = PaymentPricingSheet({ calculation, currency });
    const resultSheet = PaymentPricingSheet({ currency });

    return {
      calculate: async () => {
        const resultRaw = resultSheet.getRawPricingSheet();
        resultRaw.forEach(({ amount, category }) =>
          basePricingAdapter.log(`Payment Calculation -> ${category} ${amount}`),
        );
        return resultRaw;
      },
      calculationSheet,
      resultSheet,
    };
  },
};
