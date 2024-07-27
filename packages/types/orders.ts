import type { FindOptions } from 'mongodb';
import { SortOption } from './api.js';
import { Address, Configuration, Contact, LogFields, TimestampFields } from './common.js';
import { UnchainedCore } from './core.js';
import { OrderDeliveriesModule } from './orders.deliveries.js';
import { OrderDiscount, OrderDiscountsModule } from './orders.discounts.js';
import { OrderPaymentsModule } from './orders.payments.js';
import { OrderPositionsModule } from './orders.positions.js';
import { IOrderPricingSheet, OrderPrice, OrderPricingDiscount } from './orders.pricing.js';
import { Product } from './products.js';
import { User } from './user.js';
import { info } from 'console';

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  FULLFILLED = 'FULLFILLED',
  REJECTED = 'REJECTED',
}

export type OrderReport = {
  createdCount: number;
  orderedCount: number;
  rejectedCount: number;
  confirmedCount: number;
  fullFilledCount: number;
};

export type Order = {
  _id?: string;
  billingAddress?: Address;
  calculation: Array<any>;
  confirmed?: Date;
  rejected?: Date;
  contact?: Contact;
  context?: any;
  countryCode: string;
  currency: string;
  deliveryId?: string;
  fullfilled?: Date;
  ordered?: Date;
  orderNumber?: string;
  originEnrollmentId?: string;
  paymentId?: string;
  status: OrderStatus | null;
  userId: string;
} & LogFields &
  TimestampFields;

/*
 * Module
 */

export type OrderQuery = {
  includeCarts?: boolean;
  queryString?: string;
  status?: string;
  userId?: string;
};

export type OrderTransactionContext = {
  paymentContext?: any;
  deliveryContext?: any;
  comment?: string;
  nextStatus?: OrderStatus;
};
export type OrderContextParams<P> = (
  order: Order,
  params: P,
  unchainedAPI: UnchainedCore,
) => Promise<Order>;

export interface OrderQueries {
  findOrder: (
    params: {
      orderId?: string;
      orderNumber?: string;
    },
    options?: FindOptions,
  ) => Promise<Order>;
  findOrders: (
    params: OrderQuery & {
      limit?: number;
      offset?: number;
      sort?: Array<SortOption>;
    },
    options?: FindOptions,
  ) => Promise<Array<Order>>;
  count: (query: OrderQuery) => Promise<number>;
  orderExists: (params: { orderId: string }) => Promise<boolean>;
  getReport: (params?: { from?: Date; to?: Date }) => Promise<OrderReport>;
}
export interface OrderTransformations {
  discounted: (
    order: Order,
    orderDiscount: OrderDiscount,
    unchainedAPI: UnchainedCore,
  ) => Promise<Array<OrderPricingDiscount>>;
  discountTotal: (
    order: Order,
    orderDiscount: OrderDiscount,
    unchainedAPI: UnchainedCore,
  ) => Promise<OrderPrice>;

  isCart: (order: Order) => boolean;
  cart: (order: { countryContext?: string; orderNumber?: string; userId: string }) => Promise<Order>;
  pricingSheet: (order: Order) => IOrderPricingSheet;
}

export interface OrderProcessing {
  checkout: (
    orderId: string,
    params: OrderTransactionContext,
    unchainedAPI: UnchainedCore,
  ) => Promise<Order>;
  confirm: OrderContextParams<OrderTransactionContext>;
  reject: OrderContextParams<OrderTransactionContext>;
  processOrder: OrderContextParams<OrderTransactionContext>;
  updateStatus: (orderId: string, params: { status: OrderStatus; info?: string }) => Promise<Order>;
}

export interface OrderMutations {
  create: (doc: {
    userId: string;
    billingAddress?: Address;
    contact?: Contact;
    countryCode: string;
    currency: string;
    orderNumber?: string;
    originEnrollmentId?: string;
  }) => Promise<Order>;

  delete: (orderId: string) => Promise<number>;

  initProviders: (order: Order, unchainedAPI: UnchainedCore) => Promise<Order>;
  invalidateProviders: (unchainedAPI: UnchainedCore, maxAgeDays: number) => Promise<void>;

  setCartOwner: (params: { orderId: string; userId: string }) => Promise<void>;
  moveCartPositions: (params: { fromOrderId: string; toOrderId: string }) => Promise<void>;

  setDeliveryProvider: (
    orderId: string,
    deliveryProviderId: string,
    unchainedAPI: UnchainedCore,
  ) => Promise<Order>;
  setPaymentProvider: (
    orderId: string,
    paymentProviderId: string,
    unchainedAPI: UnchainedCore,
  ) => Promise<Order>;

  updateBillingAddress: (
    orderId: string,
    billingAddress: Address,
    unchainedAPI: UnchainedCore,
  ) => Promise<Order>;
  updateContact: (orderId: string, contact: Contact, unchainedAPI: UnchainedCore) => Promise<Order>;
  updateContext: (orderId: string, context: any, unchainedAPI: UnchainedCore) => Promise<Order | null>;
  updateCalculation: (orderId: string, unchainedAPI: UnchainedCore) => Promise<Order>;
}

export type OrdersModule = OrderQueries &
  OrderTransformations &
  OrderProcessing &
  OrderMutations & {
    // Sub entities
    deliveries: OrderDeliveriesModule;
    discounts: OrderDiscountsModule;
    positions: OrderPositionsModule;
    payments: OrderPaymentsModule;
  };

/*
 * Services
 */

export type MigrateOrderCartsService = (
  params: {
    fromUserId: string;
    toUserId: string;
    shouldMerge: boolean;
    countryContext: string;
  },
  unchainedAPI: UnchainedCore,
) => Promise<Order>;

export type NextUserCartService = (
  params: {
    user: User;
    orderNumber?: string;
    countryCode?: string;
    forceCartCreation?: boolean;
  },
  unchainedAPI: UnchainedCore,
) => Promise<Order | null>;

export interface OrderServices {
  migrateOrderCarts: MigrateOrderCartsService;
  nextUserCart: NextUserCartService;
}

/*
 * Settings
 */

export interface OrderSettingsOrderPositionValidation {
  order: Order;
  product: Product;
  quantityDiff?: number;
  configuration?: Configuration;
}

export interface OrdersSettingsOptions {
  ensureUserHasCart?: boolean;
  orderNumberHashFn?: (order: Order, index: number) => string;
  validateOrderPosition?: (
    validationParams: OrderSettingsOrderPositionValidation,
    context: UnchainedCore,
  ) => Promise<void>;
  lockOrderDuringCheckout?: boolean;
}
