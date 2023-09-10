import { IBaseAdapter, IBaseDirector } from './common.js';
import { UnchainedCore } from './core.js';
import { Discount } from './discount.js';
import { Order } from './orders.js';
import { OrderDelivery } from './orders.deliveries.js';
import { OrderDiscount } from './orders.discounts.js';
import { OrderPayment } from './orders.payments.js';
import { OrderPosition } from './orders.positions.js';
import { User } from './user.js';

export interface BasePricingAdapterContext extends UnchainedCore {
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
  baseCategory?: string;
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
  taxSum: (filter?: Partial<Calculation>) => number;
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

  addTax: (params: { amount: number; rate?: number; meta?: any }) => void;
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
  buildPricingContext: (
    context: PricingContext,
    unchainedAPI: UnchainedCore,
  ) => Promise<PricingAdapterContext>;
  actions: (
    pricingContext: PricingContext,
    unchainedAPI: UnchainedCore,
    buildPricingContext?: (
      pricingCtx: PricingContext,
      unchainedAPI: UnchainedCore,
    ) => Promise<PricingAdapterContext>,
  ) => Promise<
    IPricingAdapterActions<Calculation, PricingAdapterContext> & {
      calculationSheet: () => PricingAdapterSheet;
    }
  >;
};
