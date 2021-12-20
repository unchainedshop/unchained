import { Context } from '@unchainedshop/types/api';
import { Order } from '@unchainedshop/types/orders';
import { BaseCalculation, IPricingAdapter } from '@unchainedshop/types/pricing';
import { User } from '@unchainedshop/types/user';
import { log, LogLevel } from 'meteor/unchained:logger';

export enum BasePricingCategory {
  Item = 'ITEM',
}

export interface BasePricingAdapterContext extends Context {
  order: Order;
  user: User;
}

export const BasePricingAdapter: IPricingAdapter<
  BasePricingAdapterContext,
  BaseCalculation<BasePricingCategory>
> = {
  key: '',
  label: '',
  version: '',
  orderIndex: 0,

  isActivatedFor: async (context) => {
    return false;
  },

  get: ({ context, calculation, discounts }) => ({
    calculate: async () => {
      return [];
    },
  }),

  log(message: string, { level = LogLevel.Debug, ...options } = {}) {
    return log(message, { level, ...options });
  },
};
