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

  actions: (params) => {
    const { context, calculation } = params;
    const { currency } = context.order;
    const calculationSheet = PaymentPricingSheet({ calculation, currency });
    const resultSheet = PaymentPricingSheet({ currency });

    return {
      ...basePricingAdapter.actions(params),
      calculate: async () => {
        const resultRaw = resultSheet.getRawPricingSheet();
        resultRaw.forEach(({ amount, category }) =>
          basePricingAdapter.log(`Payment Calculation -> ${category} ${amount}`),
        );
        return resultRaw;
      },
      calculationSheet: () => calculationSheet,
      resultSheet: () => resultSheet,
    };
  },
};
