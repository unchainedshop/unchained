import type { Order } from '@unchainedshop/core-orders';

import { UnchainedCore } from './core.js';
import { OrderDiscount } from './orders.discounts.js';
import { IPricingSheet, PricingCalculation } from './pricing.js';
import { IBaseAdapter, IBaseDirector } from '@unchainedshop/utils';

export interface DiscountContext {
  code?: string;
  orderDiscount?: OrderDiscount;
  order?: Order;
}

export interface Discount<DiscountConfiguration> {
  discountId: string;
  configuration: DiscountConfiguration;
}

export interface DiscountAdapterActions<DiscountConfiguration> {
  isValidForSystemTriggering: () => Promise<boolean>;
  isValidForCodeTriggering: (params: { code: string }) => Promise<boolean>;

  discountForPricingAdapterKey: (params: {
    pricingAdapterKey: string;
    calculationSheet: IPricingSheet<PricingCalculation>;
  }) => DiscountConfiguration;

  reserve: (params: { code: string }) => Promise<any>;
  release: () => Promise<void>;
}

export type IDiscountAdapter<DiscountConfiguration> = IBaseAdapter & {
  orderIndex: number;

  isManualAdditionAllowed: (code: string) => Promise<boolean>;
  isManualRemovalAllowed: () => Promise<boolean>;

  actions: (params: {
    context: DiscountContext & UnchainedCore;
  }) => Promise<DiscountAdapterActions<DiscountConfiguration>>;
};

export type IDiscountDirector<DiscountConfiguration> = IBaseDirector<
  IDiscountAdapter<DiscountConfiguration>
> & {
  actions: (
    discountContext: DiscountContext,
    unchainedAPI: UnchainedCore,
  ) => Promise<{
    resolveDiscountKeyFromStaticCode: (params: { code: string }) => Promise<string | null>;
    findSystemDiscounts: () => Promise<Array<string>>;
  }>;
};
