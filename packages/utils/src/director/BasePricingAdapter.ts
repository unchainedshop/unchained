import {
  PricingCalculation,
  BasePricingAdapterContext,
  IPricingAdapter,
  IPricingSheet,
  IBasePricingSheet,
} from '@unchainedshop/types/pricing';
import { log, LogLevel } from 'meteor/unchained:logger';
import { BasePricingSheet } from './BasePricingSheet';

export const BasePricingAdapter = <
  Context extends BasePricingAdapterContext,
  Calculation extends PricingCalculation
>(): IPricingAdapter<Context, Calculation, IBasePricingSheet<Calculation>> => ({
  key: '',
  label: '',
  version: '',
  orderIndex: 0,

  isActivatedFor: async () => {
    return false;
  },

  actions: (params) => ({
    calculate: async () => {
      return [];
    },
    calculationSheet: () => BasePricingSheet(params),
    resultSheet: () => BasePricingSheet(params),
  }),

  log(message: string, { level = LogLevel.Debug, ...options } = {}) {
    return log(message, { level, ...options });
  },
});
