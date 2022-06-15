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
  total: (params?: { category?: string; useNetPrice?: boolean }) => {
    amount: number;
    currency: string;
  };

  filterBy: (filter?: Partial<Calculation>) => Array<Calculation>;

  resetCalculation: (sheetToInvert: IBasePricingSheet<Calculation>) => Array<Calculation>;
}

export interface IPricingSheet<Calculation extends PricingCalculation>
  extends IBasePricingSheet<Calculation> {
  discountPrices: (discountId?: string) => Array<PricingDiscount>;
  discountSum: (discountId?: string) => number;
  addDiscount: (params: {
    amount: number;
    isTaxable: boolean;
    isNetPrice: boolean;
    discountId: string;
    meta?: any;
  }) => void;
  getDiscountRows: (discountId: string) => Array<Calculation>;

  addTax: (params: { amount: number; rate: number; meta?: any }) => void;
  getTaxRows: () => Array<Calculation>;
}

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
> = IBaseAdapter & {
  orderIndex: number;

  isActivatedFor: (context: PricingAdapterContext) => boolean;

  actions: (params: {
    context: PricingAdapterContext;
    calculationSheet: Sheet;
    discounts: Array<Discount>;
  }) => IPricingAdapterActions<Calculation, PricingAdapterContext> & { resultSheet: () => Sheet };
};

export type IPricingDirector<
  PricingContext extends BasePricingContext,
  Calculation extends PricingCalculation,
  PricingAdapterContext extends BasePricingAdapterContext,
  PricingAdapterSheet extends IPricingSheet<Calculation>,
  Adapter extends IPricingAdapter<PricingAdapterContext, Calculation, PricingAdapterSheet>,
> = IBaseDirector<Adapter> & {
  buildPricingContext: (context: any, requestContext: Context) => Promise<PricingAdapterContext>;
  actions: (
    pricingContext: PricingContext,
    requestContext: Context,
    buildPricingContext?: (pricingCtx: any, requestCtx: Context) => Promise<PricingAdapterContext>,
  ) => Promise<
    IPricingAdapterActions<Calculation, PricingAdapterContext> & {
      calculationSheet: () => PricingAdapterSheet;
    }
  >;
};
