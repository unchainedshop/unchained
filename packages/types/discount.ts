import { IBaseAdapter, IBaseDirector } from './common.js';
import { UnchainedCore } from './core.js';
import { Order } from './orders.js';
import { OrderDiscount } from './orders.discounts.js';
import { IPricingSheet, PricingCalculation } from './pricing.js';

export interface DiscountConfiguration<T = any> extends Record<string, any> {
  fixedRate?: number;
  rate?: number;
  isNetPrice?: boolean;
  filter?: (data: T) => boolean;
}

export interface DiscountContext {
  code?: string;
  orderDiscount?: OrderDiscount;
  order?: Order;
}

export interface Discount<T> {
  discountId: string;
  configuration: DiscountConfiguration<T>;
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
