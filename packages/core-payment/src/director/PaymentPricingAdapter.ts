import {
  IPaymentPricingSheet,
  PaymentPricingAdapterContext,
  PaymentPricingCalculation,
} from '@unchainedshop/types/payments.pricing';
import { IPricingAdapter } from '@unchainedshop/types/pricing.js';
import { BasePricingAdapter } from '@unchainedshop/utils';
import { PaymentPricingSheet } from './PaymentPricingSheet.js';

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
    const { context } = params;
    const { currency } = context.order;
    const baseActions = basePricingAdapter.actions(params);
    const resultSheet = PaymentPricingSheet({ currency });

    return {
      ...baseActions,
      calculate: async () => {
        const resultRaw = resultSheet.getRawPricingSheet();
        resultRaw.forEach(({ amount, category }) =>
          basePricingAdapter.log(`Payment Calculation -> ${category} ${amount}`),
        );
        return resultRaw;
      },
      resultSheet: () => resultSheet,
    };
  },
};
