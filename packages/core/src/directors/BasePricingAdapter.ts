import { createLogger } from '@unchainedshop/logger';
import { IPricingSheet } from './BasePricingSheet.js';
import { IBaseAdapter, PricingCalculation } from '@unchainedshop/utils';
import { Discount } from './BasePricingDirector.js';

const logger = createLogger('unchained:core');

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
  Sheet extends IPricingSheet<Calculation>,
> {
  calculate: () => Promise<Array<Calculation>>;
  resultSheet: () => Sheet;
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
  }) => IPricingAdapterActions<Calculation, Sheet>;
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

  actions: () => {
    return {
      calculate: async () => {
        throw new Error('Method not implemented.');
      },
      resultSheet: () => {
        throw new Error('Method not implemented.');
      }, // abstract
    };
  },

  log(message: string, options) {
    return logger.debug(message, options);
  },
});
