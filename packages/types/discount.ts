import { IBaseAdapter, IBaseDirector } from './common';
import { UnchainedCore } from './core';
import { Order } from './orders';
import { OrderDiscount } from './orders.discounts';
import { IPricingSheet, PricingCalculation } from './pricing';

export interface DiscountConfiguration {
  fixedRate?: number;
  rate?: number;
  isNetPrice?: boolean;
}

export interface DiscountContext {
  code?: string;
  orderDiscount?: OrderDiscount;
  order?: Order;
}

export interface Discount {
  discountId: string;
  configuration: DiscountConfiguration;
}

export interface DiscountAdapterActions {
  isValidForSystemTriggering: () => Promise<boolean>;
  isValidForCodeTriggering: (params: { code: string }) => Promise<boolean>;

  discountForPricingAdapterKey: (params: {
    pricingAdapterKey: string;
    calculationSheet: IPricingSheet<PricingCalculation>;
  }) => DiscountConfiguration;

  reserve: (params: { code: string }) => Promise<any>;
  release: () => Promise<void>;
}

export type IDiscountAdapter = IBaseAdapter & {
  orderIndex: number;

  isManualAdditionAllowed: (code: string) => Promise<boolean>;
  isManualRemovalAllowed: () => Promise<boolean>;

  actions: (params: { context: DiscountContext & UnchainedCore }) => Promise<DiscountAdapterActions>;
};

export type IDiscountDirector = IBaseDirector<IDiscountAdapter> & {
  actions: (
    discountContext: DiscountContext,
    unchainedAPI: UnchainedCore,
  ) => Promise<{
    resolveDiscountKeyFromStaticCode: (params: { code: string }) => Promise<string | null>;
    findSystemDiscounts: () => Promise<Array<string>>;
  }>;
};
