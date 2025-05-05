import { IPricingSheet } from './BasePricingSheet.js';
import { BaseAdapter, IBaseAdapter, PricingCalculation } from '@unchainedshop/utils';
import { Discount } from './BasePricingDirector.js';
import { Order, OrderDiscount } from '@unchainedshop/core-orders';

interface IDiscountableItem {
  _id?: string;
  orderId?: string;
}

export interface BasePricingAdapterContext {
  order?: Order;
  discounts: OrderDiscount[];
}

export type BasePricingContext =
  | {
      order?: Order;
      discounts?: OrderDiscount[];
    }
  | {
      item: IDiscountableItem;
    };

export interface IPricingAdapterActions<
  Calculation extends PricingCalculation,
  Sheet extends IPricingSheet<Calculation>,
> {
  calculate: () => Promise<Calculation[]>;
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
    discounts: Discount<DiscountConfiguration>[];
  }) => IPricingAdapterActions<Calculation, Sheet>;
};

export const BasePricingAdapter = <
  PricingAdapterContext extends BasePricingAdapterContext,
  Calculation extends PricingCalculation,
>(): IPricingAdapter<PricingAdapterContext, Calculation, IPricingSheet<Calculation>> => ({
  ...BaseAdapter,
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
});
