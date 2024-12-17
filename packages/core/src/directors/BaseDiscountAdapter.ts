import { log, LogLevel } from '@unchainedshop/logger';
import { IBaseAdapter } from '@unchainedshop/utils';
import { IPricingSheet } from './BasePricingSheet.js';
import { PricingCalculation } from '@unchainedshop/utils';
export interface DiscountContext {
  code?: string;
  orderDiscount?: { _id?: string; orderId: string };
  order?: { _id?: string; userId: string };
}

export type IDiscountAdapter<DiscountConfiguration, Context> = IBaseAdapter & {
  orderIndex: number;

  isManualAdditionAllowed: (code: string) => Promise<boolean>;
  isManualRemovalAllowed: () => Promise<boolean>;

  actions: (params: {
    context: DiscountContext & Context;
  }) => Promise<DiscountAdapterActions<DiscountConfiguration>>;
};

export interface DiscountAdapterActions<DiscountConfiguration> {
  isValidForSystemTriggering: () => Promise<boolean>;
  isValidForCodeTriggering: (params: { code: string }) => Promise<boolean>;

  discountForPricingAdapterKey: (params: {
    pricingAdapterKey: string;
    calculationSheet: IPricingSheet<PricingCalculation>;
  }) => DiscountConfiguration;

  reserve: (params: { code: string }) => Promise<any>;
  release: () => Promise<void>;
}

export const BaseDiscountAdapter: Omit<
  IDiscountAdapter<unknown, unknown>,
  'key' | 'label' | 'version'
> = {
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
