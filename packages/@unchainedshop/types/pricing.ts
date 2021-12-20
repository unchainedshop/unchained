import { IBaseAdapter, IBaseDirector } from './common';
import { Context } from './api';
import { Order, OrderDelivery, OrderDiscount } from './orders';
import { Discount } from './discounting';
import { User } from './user';

export interface BasePricingAdapterContext extends Context {
  order: Order;
  user: User;
}

export interface BasePricingContext {
  order?: Order;
  user?: User;
  discounts?: Array<OrderDiscount>;
}

export interface BaseCalculation {
  category: string;
  amount: number;
  meta?: any;
}

export interface PricingSheetParams<Calculation extends BaseCalculation> {
  calculation?: Array<Calculation>;
  currency?: string;
  quantity?: number;
}

export interface IPricingSheet<Calculation extends BaseCalculation> {
  calculation: Array<Calculation>;
  currency?: string;
  quantity?: number;

  getRawPricingSheet: () => Array<Calculation>;

  isValid: () => boolean;
  gross: () => number;
  net: () => number;
  sum: (filter?: Partial<Calculation>) => number;
  taxSum: () => number;
  total: (
    category: string,
    useNetPrice: boolean
  ) => {
    amount: number;
    currency: string;
  };

  filterBy: (filter?: Partial<Calculation>) => Array<Calculation>;
}

export interface IPricingAdapterActions<Calculation extends BaseCalculation> {
  calculate: () => Promise<Array<Calculation>>;
}

export type IPricingAdapter<
  PricingContext extends BasePricingAdapterContext,
  Calculation extends BaseCalculation,
  Sheet extends IPricingSheet<Calculation>
> = IBaseAdapter & {
  orderIndex: number;

  isActivatedFor: (pricingContext: PricingContext) => Promise<boolean>;

  get: (params: {
    context: PricingContext;
    calculation: Array<Calculation>;
    discounts: Array<Discount>;
  }) => IPricingAdapterActions<Calculation> & {
    calculationSheet: Sheet;
    resultSheet: Sheet;
  };
};

export type IPricingDirector<
  PricingContext extends BasePricingContext,
  Calculation extends BaseCalculation,
  Adapter extends IBaseAdapter
> = IBaseDirector<Adapter> & {
  buildPricingContext: (context: any) => PricingContext;
  get: (
    pricingContext: any,
    requestContext: Context
  ) => IPricingAdapterActions<Calculation>;
};

/*
 * Delivery pricing
 */

export enum DeliveryPricingRowCategory {
  Delivery = 'DELIVERY',
  Discount = 'DISCOUNT',
  Tax = 'TAX',
  Item = 'ITEM', // Propably unused
}

export interface DeliveryPricingCalculation extends BaseCalculation {
  amount: number;
  category: string;
  discountId?: string;
  isNetPrice: boolean;
  isTaxable: boolean;
  meta?: any;
  rate?: number;
}

export interface DeliveryPricingAdapterContext
  extends BasePricingAdapterContext {
  country?: string;
  currency?: string;
  deliveryProvider: any; // TODO: Replace with delivery provider
  discounts: Array<Discount>;
  order: Order;
  orderDelivery: OrderDelivery;
  quantity: number;
  user: User;
}

export interface DeliveryPricingContext {
  country?: string;
  currency?: string;
  deliveryProvider?: any; // TODO: Replace with delivery provider
  discounts: Array<OrderDiscount>;
  order?: Order;
  orderDelivery?: OrderDelivery;
  providerContext?: any;
  quantity?: number;
  user?: User;
}

export interface IDeliveryPricingSheet
  extends IPricingSheet<
    DeliveryPricingCalculation
  > {
  addDiscount(params: {
    amount: number;
    isTaxable: boolean;
    isNetPrice: boolean;
    discountId: string;
    meta?: any;
  }): void;
  addFee(params: {
    amount: number;
    isTaxable: boolean;
    isNetPrice: boolean;
    meta?: any;
  }): void;
  addTax(params: { amount: number; rate: number; meta?: any }): void;

  feeSum: () => number;
  discountSum: (discountId: string) => number;
  discountPrices: (explicitDiscountId: string) => Array<{
    discountId: string;
    amount: number;
    currency: string;
  }>;

  getFeeRows: () => Array<DeliveryPricingCalculation>;
  getDiscountRows: (discountId: string) => Array<DeliveryPricingCalculation>;
  getTaxRows: () => Array<DeliveryPricingCalculation>;
}
export interface IDeliveryPricingAdapter
  extends IPricingAdapter<
    DeliveryPricingAdapterContext,
    DeliveryPricingCalculation,
    IDeliveryPricingSheet
  > {}

export interface IDeliveryPricingDirector
  extends IPricingDirector<
    DeliveryPricingContext,
    DeliveryPricingCalculation,
    IDeliveryPricingAdapter
  > {
  resultSheet: () => IDeliveryPricingSheet;
}
