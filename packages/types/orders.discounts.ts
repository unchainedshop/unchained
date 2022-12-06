import { FindOptions, TimestampFields, _ID } from './common';
import { UnchainedCore } from './core';
import { DiscountAdapterActions, DiscountConfiguration, DiscountContext } from './discount';
import { Order } from './orders';
import { OrderPrice } from './orders.pricing';
import { IPricingSheet, PricingCalculation } from './pricing';

export enum OrderDiscountTrigger {
  USER = 'USER',
  SYSTEM = 'SYSTEM',
}

export type OrderDiscount = {
  _id?: _ID;
  orderId: string;
  code?: string;
  total?: OrderPrice;
  trigger?: OrderDiscountTrigger;
  discountKey?: string;
  reservation?: any;
  context?: any;
} & TimestampFields;

export type OrderDiscountsModule = {
  // Queries
  findOrderDiscount: (params: { discountId: string }, options?: FindOptions) => Promise<OrderDiscount>;
  findOrderDiscounts: (params: { orderId: string }) => Promise<Array<OrderDiscount>>;

  // Transformations
  interface: (
    orderDiscount: OrderDiscount,
    unchainedAPI: UnchainedCore,
  ) => Promise<DiscountAdapterActions>;

  isValid: (orderDiscount: OrderDiscount, unchainedAPI: UnchainedCore) => Promise<boolean>;

  // Adapter
  configurationForPricingAdapterKey: (
    orderDiscount: OrderDiscount,
    adapterKey: string,
    calculationSheet: IPricingSheet<PricingCalculation>,
    pricingContext: DiscountContext & UnchainedCore,
  ) => Promise<DiscountConfiguration>;

  // Mutations
  createManualOrderDiscount: (
    params: { code: string; order: Order },
    unchainedAPI: UnchainedCore,
  ) => Promise<OrderDiscount>;

  create: (doc: OrderDiscount) => Promise<OrderDiscount>;
  update: (orderDiscountId: string, doc: OrderDiscount) => Promise<OrderDiscount>;
  delete: (orderDiscountId: string, unchainedAPI: UnchainedCore) => Promise<OrderDiscount>;
};
