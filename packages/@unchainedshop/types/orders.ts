import { Context } from './api';
import { Address, Contact, FindOptions, LogFields, Locale, TimestampFields, _ID } from './common';
import { OrderDeliveriesModule } from './orders.deliveries';
import { OrderDiscount, OrderDiscountsModule } from './orders.discounts';
import { OrderPaymentsModule } from './orders.payments';
import { OrderPositionsModule } from './orders.positions';
import { IOrderPricingSheet, OrderPrice, OrderPricingDiscount } from './orders.pricing';
import { User } from './user';

export enum OrderStatus {
  OPEN = 'OPEN', // Null value is mapped to OPEN status
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  FULLFILLED = 'FULLFILLED',
}

export enum OrderDocumentType {
  ORDER_CONFIRMATION = 'ORDER_CONFIRMATION',
  DELIVERY_NOTE = 'DELIVERY_NOTE',
  INVOICE = 'INVOICE',
  RECEIPT = 'RECEIPT',
  OTHER = 'OTHER',
}

export type Order = {
  _id?: _ID;
  billingAddress?: Address;
  calculation: Array<any>;
  confirmed?: Date;
  contact?: Contact;
  context?: any;
  countryCode: string;
  currency: string;
  deliveryId?: string;
  fullfilled?: Date;
  orderCode?: string;
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

type OrderTransactionContext = {
  transactionContext?: any;
  paymentContext?: any;
  deliveryContext?: any;
  orderContext?: any;
};
type OrderContextParams<P> = (order: Order, params: P, requestContext: Context) => Promise<Order>;

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
    },
    options?: FindOptions,
  ) => Promise<Array<Order>>;
  count: (query: OrderQuery) => Promise<number>;
  orderExists: (params: { orderId: string }) => Promise<boolean>;
}
export interface OrderTransformations {
  discounted: (
    order: Order,
    orderDiscount: OrderDiscount,
    requestContext: Context,
  ) => Promise<Array<OrderPricingDiscount>>;
  discountTotal: (
    order: Order,
    orderDiscount: OrderDiscount,
    requestContext: Context,
  ) => Promise<OrderPrice>;

  normalizedStatus: (order: Order) => string;
  isCart: (order: Order) => boolean;
  cart: (order: { countryContext?: string; orderNumber?: string }, user: User) => Promise<Order>;
  pricingSheet: (order: Order) => IOrderPricingSheet;
}

export interface OrderProcessing {
  checkout: OrderContextParams<OrderTransactionContext>;
  confirm: OrderContextParams<OrderTransactionContext>;
  ensureCartForUser: (
    params: { user: User; countryCode?: string },
    requestContext: Context,
  ) => Promise<Order>;
  migrateCart: (
    params: {
      fromCart: Order;
      shouldMerge: boolean;
      toCart?: Order;
    },
    requestContext: Context,
  ) => Promise<Order>;
  processOrder: OrderContextParams<OrderTransactionContext>;
  sendOrderConfirmationToCustomer: OrderContextParams<{ locale: Locale }>;
}

export interface OrderMutations {
  create: (
    doc: {
      billingAddress?: Address;
      contact?: Contact;
      countryCode: string;
      currency: string;
      orderNumber?: string;
      originEnrollmentId?: string;
    },
    userId?: string,
  ) => Promise<Order>;

  delete: (orderId: string, userId?: string) => Promise<number>;

  initProviders: (order: Order, requestContext: Context) => Promise<Order>;
  invalidateProviders: (requestContext: Context) => Promise<void>;

  setDeliveryProvider: (
    orderId: string,
    deliveryProviderId: string,
    requestContext: Context,
  ) => Promise<Order>;
  setPaymentProvider: (
    orderId: string,
    paymentProviderId: string,
    requestContext: Context,
  ) => Promise<Order>;

  updateBillingAddress: (
    orderId: string,
    billingAddress: Address,
    requestContext: Context,
  ) => Promise<Order>;
  updateContact: (orderId: string, contact: Contact, requestContext: Context) => Promise<Order>;
  updateContext: (orderId: string, context: any, requestContext: Context) => Promise<Order>;
  updateStatus: (
    orderId: string,
    params: { status: OrderStatus; info?: string },
    requestContext: Context,
  ) => Promise<Order>;

  updateCalculation: (orderId: string, requestContext: Context) => Promise<Order>;
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
    fromUser: User;
    toUser: User;
    shouldMerge: boolean;
  },
  requestContext: Context,
) => Promise<Order>;

export type CreateUserCartService = (
  params: {
    user: User;
    orderNumber?: string;
    countryCode?: string;
  },
  requestContext: Context,
) => Promise<Order>;

export interface OrderServices {
  migrateOrderCarts: MigrateOrderCartsService;
  createUserCart: CreateUserCartService;
}

/*
 * Settings
 */

export interface OrdersSettingsOptions {
  ensureUserHasCart?: boolean;
  orderNumberHashFn?: (order: Order, index: number) => string;
}
