import {
  OrderDiscountDirector,
  OrderDiscountAdapter,
  ProductDiscountConfiguration,
  UnchainedCore,
  IDiscountAdapter,
} from '@unchainedshop/core';

export const HalfPriceManual: IDiscountAdapter<ProductDiscountConfiguration, UnchainedCore> = {
  ...OrderDiscountAdapter,

  key: 'shop.unchained.discount.half-price-manual',
  label: 'Half Price Manual',
  version: '1.0.0',
  orderIndex: 10,

  // return true if a discount is allowed to get added manually by a user
  isManualAdditionAllowed: async () => {
    return true;
  },

  // return true if a discount is allowed to get removed manually by a user
  isManualRemovalAllowed: async () => {
    return true;
  },

  actions: async ({ context }) => ({
    ...(await OrderDiscountAdapter.actions({ context })),

    isValidForSystemTriggering: async () => {
      return false;
    },

    isValidForCodeTriggering: async ({ code }) => {
      return code === 'HALFPRICE';
    },

    // returns the appropriate discount context for a calculation adapter
    discountForPricingAdapterKey({ pricingAdapterKey }) {
      if (pricingAdapterKey === 'shop.unchained.pricing.product-discount') {
        return { rate: 0.5 };
      }
      return null;
    },
  }),
};

OrderDiscountDirector.registerAdapter(HalfPriceManual);
