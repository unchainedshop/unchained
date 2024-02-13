import { log, LogLevel } from '@unchainedshop/logger';

import { IDiscountAdapter } from '@unchainedshop/types/discount.js';

export const BaseDiscountAdapter: Omit<IDiscountAdapter<unknown>, 'key' | 'label' | 'version'> = {
  orderIndex: 0,

  isManualAdditionAllowed: async () => {
    return false;
  },

  // return true if a discount is allowed to get removed manually by a user
  isManualRemovalAllowed: async () => {
    return false;
  },

  actions: async () => ({
    // return true if a discount is valid to be part of the order
    // without input of a user. that could be a time based global discount
    // like a 10% discount day
    // if you return false, this discount will
    // get removed from the order before any price calculation
    // takes place.
    // eslint-disable-next-line
    isValidForSystemTriggering: async () => {
      return false;
    },

    // return an arbitrary JSON serializable object with reservation data
    // this method is called when a discount is added through a manual code and let's
    // you manually deduct expendable discounts (coupon balances for ex.) before checkout
    reserve: async () => {
      return {};
    },

    // return void, allows you to free up any reservations in backend systems
    release: async () => {
      return null;
    },

    // return true if a discount is valid to be part of the order.
    // if you return false, this discount will
    // get removed from the order before any price calculation
    // takes place.
    isValidForCodeTriggering: async () => {
      return false;
    },

    // returns the appropriate discount context for a calculation adapter
    discountForPricingAdapterKey() {
      return null;
    },
  }),

  log(message: string, { level = LogLevel.Debug, ...options } = {}) {
    return log(message, { level, ...options });
  },
};
