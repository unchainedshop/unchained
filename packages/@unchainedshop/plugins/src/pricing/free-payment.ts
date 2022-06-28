import { PaymentPricingAdapter, PaymentPricingDirector } from '@unchainedshop/core-payment';
import { IPaymentPricingAdapter } from '@unchainedshop/types/payments.pricing';

export const PaymentFreePrice: IPaymentPricingAdapter = {
  ...PaymentPricingAdapter,

  key: 'shop.unchained.pricing.payment-free',
  version: '1.0',
  label: 'Free Payment',
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
          meta: { adapter: PaymentFreePrice.key },
        });
        return pricingAdapter.calculate();
      },
    };
  },
};

PaymentPricingDirector.registerAdapter(PaymentFreePrice);
