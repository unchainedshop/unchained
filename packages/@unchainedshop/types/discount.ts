import { Context } from './api';
import { IBaseAdapter, IBaseDirector } from './common';
import { Order } from './orders';
import { OrderDiscount } from './orders.discounts';
import { Product, ProductDiscount } from './products';

export interface DiscountConfiguration {
  fixedRate?: number;
  rate?: number;
  isNetPrice?: boolean;
}

export interface Discount {
  discountId: string;
  configuration: DiscountConfiguration;
}

export interface DiscountContext {
  order: Order;
  orderDiscount?: OrderDiscount;
}

export interface DiscountAdapterActions {
  isValidForSystemTriggering: () => Promise<boolean>;
  isValidForCodeTriggering: (params: { code: string }) => Promise<boolean>;

  discountForPricingAdapterKey: (params: { pricingAdapterKey: string }) => DiscountConfiguration;

  reserve: (params: { code: string }) => Promise<any>;
  release: () => Promise<void>;
}

export type IDiscountAdapter = IBaseAdapter & {
  orderIndex: number;

  isManualAdditionAllowed: (code: string) => Promise<boolean>;
  isManualRemovalAllowed: () => Promise<boolean>;

  actions: (params: { context: DiscountContext & Context }) => DiscountAdapterActions;
};

export type IDiscountDirector = IBaseDirector<IDiscountAdapter> & {
  actions: (
    discountContext: DiscountContext,
    requestContext: Context,
  ) => {
    resolveDiscountKeyFromStaticCode: (params: { code: string }) => Promise<string | null>;
    findSystemDiscounts: () => Promise<Array<string>>;
  };
};
