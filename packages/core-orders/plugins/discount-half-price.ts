import { IDiscountAdapter } from '@unchainedshop/types/discount';
import {
  OrderDiscountDirector,
  OrderDiscountAdapter,
} from 'meteor/unchained:director-discounting';

const HalfPrice: IDiscountAdapter = {
  ...OrderDiscountAdapter,

  key: 'shop.unchained.discount.half-price',
  label: 'Half Price',
  version: '1.0',
  orderIndex: 3,

  // return true if a discount is allowed to get added manually by a user
  isManualAdditionAllowed: async () => {
    return false;
  },

  // return true if a discount is allowed to get removed manually by a user
  isManualRemovalAllowed: async () => {
    return false;
  },

  actions: ({ context }) => ({
    ...OrderDiscountAdapter.actions({ context }),

    isValidForSystemTriggering: async () => {
      const { order } = context;
      // TODO: use modules
      /* @ts-ignore */
      const user = order.user();
      const isUserEligibleForHalfPrice =
        user && user.tags && user.tags.indexOf('half-price') !== -1;
      return !!isUserEligibleForHalfPrice;
    },

    isValidForCodeTriggering: async ({ code }) => {
      return false;
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

OrderDiscountDirector.registerAdapter(HalfPrice);
