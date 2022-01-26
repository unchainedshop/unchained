import { Context } from './api';
import { IBaseAdapter, IBaseDirector } from './common';
import { Discount } from './discount';
import { Order } from './orders';
import { OrderDelivery } from './orders.deliveries';
import { OrderDiscount } from './orders.discounts';
import { OrderPayment } from './orders.payments';
import { OrderPosition } from './orders.positions';
import { User } from './user';

export interface BasePricingAdapterContext extends Context {
  order: Order;
  user: User;
  discounts: Array<OrderDiscount>;
}

export type BasePricingContext =
  | {
      order?: Order;
      user?: User;
      discounts?: Array<OrderDiscount>;
    }
  | {
      item: OrderDelivery | OrderPayment | OrderPosition;
    };

export interface PricingCalculation {
  category: string;
  amount: number;
  meta?: any;
}

export interface PricingDiscount {
  discountId: string;
  amount: number;
  currency: string;
}

export interface PricingSheetParams<Calculation extends PricingCalculation> {
  calculation?: Array<Calculation>;
  currency?: string;
  quantity?: number;
}

export interface IBasePricingSheet<Calculation extends PricingCalculation> {
  calculation: Array<Calculation>;
  currency?: string;
  quantity?: number;

  getRawPricingSheet: () => Array<Calculation>;

  isValid: () => boolean;
  gross: () => number;
  net: () => number;

  sum: (filter?: Partial<Calculation>) => number;
  taxSum: () => number;
  total: (params: { category?: string; useNetPrice: boolean }) => {
    amount: number;
    currency: string;
  };

  filterBy: (filter?: Partial<Calculation>) => Array<Calculation>;
}

export type IPricingSheet<Calculation extends PricingCalculation> =
  IBasePricingSheet<Calculation> & {
    feeSum: () => number;
    discountSum: (discountId: string) => number;
    discountPrices: (explicitDiscountId?: string) => Array<PricingDiscount>;

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
  };

export interface IPricingAdapterActions<
  Calculation extends PricingCalculation
> {
  calculate: () => Promise<Array<Calculation>>;
  resultSheet: () => IBasePricingSheet<Calculation>;
}

export type IPricingAdapter<
  PricingContext extends BasePricingAdapterContext,
  Calculation extends PricingCalculation,
  Sheet extends IBasePricingSheet<Calculation>
> = IBaseAdapter & {
  orderIndex: number;

  isActivatedFor: (context: PricingContext) => Promise<boolean>;

  actions: (params: {
    context: PricingContext;
    calculation: Array<Calculation>;
    discounts: Array<Discount>;
  }) => IPricingAdapterActions<Calculation> & {
    calculationSheet: () => Sheet;
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
  ) => Promise<PricingAdapterContext>;
  actions: (
    pricingContext: PricingContext,
    requestContext: Context
  ) => Promise<IPricingAdapterActions<Calculation>>;
  getCalculation: () => Array<Calculation>;
  getContext: () => PricingAdapterContext | null;
};

export type IBasePricingDirector<
  PricingContext extends BasePricingContext,
  PricingAdapterContext extends BasePricingAdapterContext,
  Calculation extends PricingCalculation,
  Adapter extends IBaseAdapter
> = Omit<
  IPricingDirector<PricingContext, PricingAdapterContext, Calculation, Adapter>,
  'actions' | 'buildPricingContext'
> & {
  actions: (
    pricingContext: PricingContext,
    requestContext: Context,
    buildPricingContext: (
      context: any,
      requestContext: Context
    ) => Promise<PricingAdapterContext>
  ) => Promise<IPricingAdapterActions<Calculation>>;
};
