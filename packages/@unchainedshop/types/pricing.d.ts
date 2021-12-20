import {
  IBaseAdapter,
  IBaseDirector,
} from 'node_modules/@unchainedshop/types/common';

export interface BasePricingContext {
  order?: Order;
  user?: User;
  discounts?: Array<OrderDiscount>;
}

export interface BaseCalculation<Category> {
  category: Category;
  amount: number;
  meta?: any;
}

export interface PricingSheetParams<
  Calculation extends BaseCalculation<Category>
> {
  calculation?: Array<Calculation>;
  currency?: string;
  quantity?: number;
}

export interface IPricingSheet<
  Category,
  Calculation extends BaseCalculation<Category>
> {
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
    category: Category,
    useNetPrice: boolean
  ) => {
    amount: number;
    currency: string;
  };

  filterBy: (filter?: Partial<Calculation>) => Array<Calculation>;
}

export interface IPricingAdapterActions<
  Calculation extends BaseCalculation<Category>
> {
  calculate: () => Promise<Array<Calculation>>;
}

export type IPricingAdapter<
  PricingContext extends BasePricingContext,
  Calculation extends BaseCalculation<Category>
> = IBaseAdapter & {
  orderIndex: number;

  isActivatedFor: (pricingContext: PricingContext) => Promise<boolean>;

  get: (params: {
    context: PricingContext;
    calculation: Array<PricingCalculation>;
    discounts: Array<Discount>;
  }) => IPricingAdapterActions<Calculation>;
};

export type IPricingDirectorActions<
  PricingContext extends BasePricingContext,
  Calculation extends BaseCalculation<Category>
> = IPricingAdapterActions<Calculation> & {
  calculate: () => Promise<Array<Calculation>>;
};

export type IPricingDirector<
  PricingContext extends BasePricingContext,
  Calculation extends BaseCalculation<Category>
> = IBaseDirector<IPricingDirectorActions<Calculation>, IPricingAdapter> & {
  buildPricingContext: (context: any) => PricingContext;
  get: (
    pricingContext: PricingContext,
    requestContext: Context
  ) => IPricingDirectorActions<Calculation>;
};
