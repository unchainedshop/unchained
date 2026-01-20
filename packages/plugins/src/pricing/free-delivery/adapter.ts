import { DeliveryPricingAdapter, type IDeliveryPricingAdapter } from '@unchainedshop/core';

export const DeliveryFreePrice: IDeliveryPricingAdapter = {
  ...DeliveryPricingAdapter,

  key: 'shop.unchained.pricing.delivery-free',
  label: 'Free Delivery',
  version: '1.0.0',
  orderIndex: 0,

  isActivatedFor: () => {
    return true;
  },

  actions: (params) => {
    const pricingAdapter = DeliveryPricingAdapter.actions(params);
    return {
      ...pricingAdapter,
      calculate: async () => {
        pricingAdapter.resultSheet().addFee({
          amount: 0,
          isTaxable: false,
          isNetPrice: false,
          meta: { adapter: DeliveryFreePrice.key },
        });
        return pricingAdapter.calculate();
      },
    };
  },
};

export default DeliveryFreePrice;
