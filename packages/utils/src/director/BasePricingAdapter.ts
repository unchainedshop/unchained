import {
  BasePricingAdapterContext,
  IPricingSheet,
  IPricingAdapter,
  PricingCalculation,
  IPricingAdapterActions,
} from '@unchainedshop/types/pricing.js';
import { log, LogLevel } from '@unchainedshop/logger';

export const BasePricingAdapter = <
  PricingAdapterContext extends BasePricingAdapterContext,
  Calculation extends PricingCalculation,
>(): IPricingAdapter<PricingAdapterContext, Calculation, IPricingSheet<Calculation>> => ({
  key: '',
  label: '',
  version: '',
  orderIndex: 0,

  isActivatedFor: () => {
    return false;
  },

  actions: (params) => {
    const calculation = [];
    const actions: IPricingAdapterActions<Calculation, PricingAdapterContext> = {
      calculate: async () => {
        return [];
      },
      getCalculation: () => calculation,
      getContext: () => params.context,
    };

    return actions as IPricingAdapterActions<Calculation, PricingAdapterContext> & {
      resultSheet: () => IPricingSheet<Calculation>;
    };
  },

  log(message: string, { level = LogLevel.Debug, ...options } = {}) {
    return log(message, { level, ...options });
  },
});
