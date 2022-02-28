import { DeliveryPricingAdapter, DeliveryPricingDirector } from 'meteor/unchained:core-delivery';
import { IDeliveryPricingAdapter } from '@unchainedshop/types/delivery.pricing';

export const DeliveryFreePrice: IDeliveryPricingAdapter = {
  ...DeliveryPricingAdapter,

  key: 'shop.unchained.pricing.delivery-free',
  version: '1.0',
  label: 'Free Delivery',
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
          meta: { adapter: DeliveryFreePrice.key },
        });
        return pricingAdapter.calculate();
      },
    };
  },
};

DeliveryPricingDirector.registerAdapter(DeliveryFreePrice);
