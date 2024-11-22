import { log, LogLevel } from '@unchainedshop/logger';
import { IPricingSheet, PricingCalculation } from './BasePricingSheet.js';
import { IBaseAdapter } from './BaseAdapter.js';
import { Discount } from './BasePricingDirector.js';

type Order = { _id?: string };
type OrderDiscount = { _id?: string };

interface IDiscountableItem {
  _id?: string;
  orderId?: string;
}

export interface BasePricingAdapterContext {
  order?: Order;
  discounts: Array<OrderDiscount>;
}

export type BasePricingContext =
  | {
      order?: Order;
      discounts?: Array<OrderDiscount>;
    }
  | {
      item: IDiscountableItem;
    };

export interface IPricingAdapterActions<
  Calculation extends PricingCalculation,
  PricingAdapterContext extends BasePricingAdapterContext,
> {
  calculate: () => Promise<Array<Calculation>>;
  getCalculation: () => Array<Calculation>;
  getContext: () => PricingAdapterContext;
}

export type IPricingAdapter<
  PricingAdapterContext extends BasePricingAdapterContext,
  Calculation extends PricingCalculation,
  Sheet extends IPricingSheet<Calculation>,
  DiscountConfiguration = unknown,
> = IBaseAdapter & {
  orderIndex: number;

  isActivatedFor: (context: PricingAdapterContext) => boolean;

  actions: (params: {
    context: PricingAdapterContext;
    calculationSheet: Sheet;
    discounts: Array<Discount<DiscountConfiguration>>;
  }) => IPricingAdapterActions<Calculation, PricingAdapterContext> & { resultSheet: () => Sheet };
};

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
