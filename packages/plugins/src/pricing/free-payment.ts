import { UnchainedCore } from '@unchainedshop/core';
import {
  PaymentPricingAdapter,
  PaymentPricingDirector,
  IPaymentPricingAdapter,
} from '@unchainedshop/core-payment';

export const PaymentFreePrice: IPaymentPricingAdapter<UnchainedCore> = {
  ...PaymentPricingAdapter,

  key: 'shop.unchained.pricing.payment-free',
  label: 'Free Payment',
  version: '1.0.0',
  orderIndex: 0,

  isActivatedFor: () => {
    return true;
  },

  actions: (params) => {
    const pricingAdapter = PaymentPricingAdapter.actions(params);

    return {
      ...pricingAdapter,
      calculate: async () => {
        pricingAdapter.resultSheet().addFee({
          amount: 0,
          isNetPrice: false,
          isTaxable: false,
          meta: { adapter: PaymentFreePrice.key },
        });
        return pricingAdapter.calculate();
      },
    };
  },
};

PaymentPricingDirector.registerAdapter(PaymentFreePrice);
