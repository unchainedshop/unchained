import { Context } from './api';
import { IBaseAdapter, IBaseDirector } from './common';
import { Order } from './orders';
import { OrderDelivery } from './orders.deliveries';
import { OrderDiscount } from './orders.discounts';
import { OrderPayment } from './orders.payments';
import { OrderPosition } from './orders.positions';
import { IBasePricingSheet, PricingCalculation } from './pricing';

export interface DiscountConfiguration {
  fixedRate?: number;
  rate?: number;
  isNetPrice?: boolean;
}

export interface DiscountContext {
  orderDiscount?: OrderDiscount;
  order?: Order;
  orderDelivery?: OrderDelivery;
  orderPositions?: Array<OrderPosition>;
  orderPayment?: OrderPayment;
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
    calculationSheet: IBasePricingSheet<PricingCalculation>;
  }) => DiscountConfiguration;

  reserve: (params: { code: string }) => Promise<any>;
  release: () => Promise<void>;
}

export type IDiscountAdapter = IBaseAdapter & {
  orderIndex: number;

  isManualAdditionAllowed: (code: string) => Promise<boolean>;
  isManualRemovalAllowed: () => Promise<boolean>;

  actions: (params: { context: DiscountContext & Context }) => Promise<DiscountAdapterActions>;
};

export type IDiscountDirector = IBaseDirector<IDiscountAdapter> & {
  actions: (
    discountContext: DiscountContext,
    requestContext: Context,
  ) => Promise<{
    resolveDiscountKeyFromStaticCode: (params: { code: string }) => Promise<string | null>;
    findSystemDiscounts: () => Promise<Array<string>>;
  }>;
};
