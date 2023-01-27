import { IDiscountAdapter } from '@unchainedshop/types/discount.js';
import { OrderDiscountDirector, OrderDiscountAdapter } from '@unchainedshop/core-orders';

export const HundredOff: IDiscountAdapter = {
  ...OrderDiscountAdapter,

  key: 'shop.unchained.discount.100-off',
  label: '100 Off',
  version: '1.0.0',
  orderIndex: 1,

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
      return code.toUpperCase() === '100OFF';
    },

    // returns the appropriate discount context for a calculation adapter
    discountForPricingAdapterKey: ({ pricingAdapterKey }) => {
      if (pricingAdapterKey === 'shop.unchained.pricing.order-discount') {
        return { fixedRate: 10000 };
      }

      return null;
    },
  }),
};

OrderDiscountDirector.registerAdapter(HundredOff);
