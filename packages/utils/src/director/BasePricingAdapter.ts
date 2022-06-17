import {
  BasePricingAdapterContext,
  IPricingSheet,
  IPricingAdapter,
  PricingCalculation,
  IPricingAdapterActions,
} from '@unchainedshop/types/pricing';
import { log, LogLevel } from '@unchainedshop/logger';

export const BasePricingAdapter = <
  Context extends BasePricingAdapterContext,
  Calculation extends PricingCalculation,
>(): IPricingAdapter<Context, Calculation, IPricingSheet<Calculation>> => ({
  key: '',
  label: '',
  version: '',
  orderIndex: 0,

  isActivatedFor: () => {
    return false;
  },

  actions: (params) => {
    const calculation = [];
    const actions: IPricingAdapterActions<Calculation, Context> = {
      calculate: async () => {
        return [];
      },
      getCalculation: () => calculation,
      getContext: () => params.context,
    };

    return actions as IPricingAdapterActions<Calculation, Context> & {
      resultSheet: () => IPricingSheet<Calculation>;
    };
  },

  log(message: string, { level = LogLevel.Debug, ...options } = {}) {
    return log(message, { level, ...options });
  },
});
