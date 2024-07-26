import type { FindOptions } from 'mongodb';
import { UnchainedCore } from './core.js';
import { DiscountAdapterActions, DiscountContext } from './discount.js';
import { Order } from './orders.js';
import { OrderPrice } from './orders.pricing.js';
import { IPricingSheet, PricingCalculation } from './pricing.js';
import type { TimestampFields } from '@unchainedshop/mongodb';

export enum OrderDiscountTrigger {
  USER = 'USER',
  SYSTEM = 'SYSTEM',
}

export type OrderDiscount = {
  _id?: string;
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
  ) => Promise<DiscountAdapterActions<any>>;

  isValid: (orderDiscount: OrderDiscount, unchainedAPI: UnchainedCore) => Promise<boolean>;

  // Adapter
  configurationForPricingAdapterKey: (
    orderDiscount: OrderDiscount,
    adapterKey: string,
    calculationSheet: IPricingSheet<PricingCalculation>,
    pricingContext: DiscountContext & UnchainedCore,
  ) => Promise<any>;

  // Mutations
  createManualOrderDiscount: (
    params: { code: string; order: Order },
    unchainedAPI: UnchainedCore,
  ) => Promise<OrderDiscount>;

  create: (doc: OrderDiscount) => Promise<OrderDiscount>;
  update: (orderDiscountId: string, doc: OrderDiscount) => Promise<OrderDiscount>;
  delete: (orderDiscountId: string, unchainedAPI: UnchainedCore) => Promise<OrderDiscount>;
};
