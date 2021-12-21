import { IDiscountAdapter } from '@unchainedshop/types/orders.discount';
import {
  DiscountDirector,
  DiscountAdapter,
} from 'meteor/unchained:core-orders';

const HalfPriceManual: IDiscountAdapter = {
  ...DiscountAdapter,

  key: 'shop.unchained.discount.half-price-manual',
  label: 'Half Price',
  version: '1.0',
  orderIndex: 2,

  // return true if a discount is allowed to get added manually by a user
  isManualAdditionAllowed: async () => {
    return true;
  },

  // return true if a discount is allowed to get removed manually by a user
  isManualRemovalAllowed: async () => {
    return true;
  },

  actions: ({ context }) => ({
    ...DiscountAdapter.actions({ context }),

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

DiscountDirector.registerAdapter(HalfPriceManual);
