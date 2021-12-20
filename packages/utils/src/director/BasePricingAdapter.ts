import {
  BaseCalculation,
  BasePricingAdapterContext,
  IPricingAdapter,
  IPricingSheet,
} from '@unchainedshop/types/pricing';
import { log, LogLevel } from 'meteor/unchained:logger';
import { BasePricingSheet } from './BasePricingSheet';

export const BasePricingAdapter = <
  Context extends BasePricingAdapterContext,
  Calculation extends BaseCalculation
>(): IPricingAdapter<
  Context,
  Calculation,
  IPricingSheet<Calculation>
> => ({
  key: '',
  label: '',
  version: '',
  orderIndex: 0,

  isActivatedFor: async (context) => {
    return false;
  },

  get: (params) => ({
    calculate: async () => {
      return [];
    },
    calculationSheet: BasePricingSheet(params),
    resultSheet: BasePricingSheet(params),
  }),

  log(message: string, { level = LogLevel.Debug, ...options } = {}) {
    return log(message, { level, ...options });
  },
});
