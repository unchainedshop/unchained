import { Context } from './api';
import { IBaseAdapter, IBaseDirector } from './common';
import { Discount } from './discounting';
import { Order, OrderDiscount } from './orders';
import { User } from './user';

export interface BasePricingAdapterContext extends Context {
  order: Order;
  user: User;
  discounts: Array<Discount>;
}

export interface BasePricingContext {
  order?: Order;
  user?: User;
  discounts?: Array<OrderDiscount>;
}

export interface PricingCalculation {
  category: string;
  amount: number;
  meta?: any;
}

export interface PricingSheetParams<Calculation extends PricingCalculation> {
  calculation?: Array<Calculation>;
  currency?: string;
  quantity?: number;
}

export interface IPricingSheet<Calculation extends PricingCalculation> {
  calculation: Array<Calculation>;
  currency?: string;
  quantity?: number;

  getRawPricingSheet: () => Array<Calculation>;

  isValid: () => boolean;
  gross: () => number;
  net: () => number;
  feeSum: () => number;
  discountSum: (discountId: string) => number;
  discountPrices: (explicitDiscountId: string) => Array<{
    discountId: string;
    amount: number;
    currency: string;
  }>;
  sum: (filter?: Partial<Calculation>) => number;
  taxSum: () => number;
  total: (
    category: string,
    useNetPrice: boolean
  ) => {
    amount: number;
    currency: string;
  };

  addDiscount: (params: {
    amount: number;
    isTaxable: boolean;
    isNetPrice: boolean;
    discountId: string;
    meta?: any;
  }) => void;
  addFee: (params: {
    amount: number;
    isTaxable: boolean;
    isNetPrice: boolean;
    meta?: any;
  }) => void;
  addTax: (params: { amount: number; rate: number; meta?: any }) => void;

  getFeeRows: () => Array<Calculation>;
  getDiscountRows: (discountId: string) => Array<Calculation>;
  getTaxRows: () => Array<Calculation>;

  filterBy: (filter?: Partial<Calculation>) => Array<Calculation>;
}

export interface IPricingAdapterActions<
  Calculation extends PricingCalculation
> {
  calculate: () => Promise<Array<Calculation>>;
}

export type IPricingAdapter<
  PricingContext extends BasePricingAdapterContext,
  Calculation extends PricingCalculation,
  Sheet extends IPricingSheet<Calculation>
> = IBaseAdapter & {
  orderIndex: number;

  isActivatedFor: (context: PricingContext) => Promise<boolean>;

  get: (params: {
    context: PricingContext;
    calculation: Array<Calculation>;
    discounts: Array<Discount>;
  }) => IPricingAdapterActions<Calculation> & {
    calculationSheet: Sheet;
    resultSheet: Sheet;
    resetCalculation?: () => void;
  };
};

export type IPricingDirector<
  PricingContext extends BasePricingContext,
  PricingAdapterContext extends BasePricingAdapterContext,
  Calculation extends PricingCalculation,
  Adapter extends IBaseAdapter
> = IBaseDirector<Adapter> & {
  buildPricingContext: (
    context: any,
    requestContext: Context
  ) => PricingAdapterContext;
  get: (
    pricingContext: PricingContext,
    requestContext: Context
  ) => IPricingAdapterActions<Calculation>;
  getCalculation: () => Array<Calculation>;
  getContext: () => PricingAdapterContext | null;
};
