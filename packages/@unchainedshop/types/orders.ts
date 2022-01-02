import { OrderDiscountsModule } from './orders.discounts';
import { Context } from './api';
import {
  Address,
  Contact,
  FindOptions,
  LogFields, TimestampFields,
  Update,
  _ID
} from './common';
import { OrderDeliveriesModule } from './orders.deliveries';
import { OrderPaymentsModule } from './orders.payments';
import { OrderPositionsModule } from './orders.positions';
import { IOrderPricingSheet } from './orders.pricing';
import { User } from './user';

export enum OrderStatus {
  OPEN = 'OPEN', // Null value is mapped to OPEN status
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  FULLFILLED = 'FULLFILLED',
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

type OrderQuery = {
  includeCarts?: boolean;
  queryString?: string;
  userId?: string;
};

export type OrdersModule = {
  // Queries
  findOrder: (
    params: {
      orderId?: string;
      orderNumber?: string;
    },
    options?: FindOptions
  ) => Promise<Order>;
  findOrders: (
    params: OrderQuery & {
      limit?: number;
      offset?: number;
    },
    options?: FindOptions
  ) => Promise<Array<Order>>;
  count: (query: OrderQuery) => Promise<number>;
  orderExists: (params: { orderId: string }) => Promise<boolean>;

  // Transformations
  normalizedStatus: (order: Order) => string;
  nextStatus: (order: Order) => Promise<OrderStatus | null>;
  isCart: (order: Order) => boolean;
  cart: (
    order: { countryContext?: string; orderNumber?: string },
    user: User
  ) => Promise<Order>;
  pricingSheet: (order: Order) => IOrderPricingSheet;

  // Checkout
  checkout: (
    order: Order,
    params: { paymentContext?: any; deliveryContext?: any; orderContext?: any },
    userId?: string
  ) => Promise<Order>;
  confirm: (
    order: Order,
    params: { paymentContext?: any; deliveryContext?: any; orderContext?: any },
    userId?: string
  ) => Promise<Order>;
  processOrder: (
    order: Order,
    params: { paymentContext?: any; deliveryContext?: any; orderContext?: any },
    userId?: string
  ) => Promise<Order>;

  // Mutations
  create: (
    doc: { orderNumber?: string; currency: string; countryCode: string, billingAddress?: Address, contact?: Contact },
    userId?: string
  ) => Promise<Order>;
  update: (_id: string, doc: Update<Order>, userId?: string) => Promise<Order>;
  delete: (_id: string, userId?: string) => Promise<number>;

  setDeliveryProvider: (
    _id: _ID,
    deliveryProviderId: string,
    requestContext: Context
  ) => Promise<Order>;
  setPaymentProvider: (
    _id: _ID,
    paymentProviderId: string,
    requestContext: Context
  ) => Promise<Order>;

  updateBillingAddress: (
    _id: _ID,
    billingAddress: Address,
    requestContext: Context
  ) => Promise<Order>;
  updateContact: (
    _id: _ID,
    contact: Contact,
    requestContext: Context
  ) => Promise<Order>;
  updateContext: (
    _id: _ID,
    context: any,
    requestContext: Context
  ) => Promise<Order>;

  updateStatus: (
    _id: _ID,
    params: { status: OrderStatus; info?: string },
    requestContext: Context
  ) => Promise<Order>;

  updateCalculation: (_id: _ID, requestContext: Context) => Promise<Order>;

  /*
   * Sub entities
   */

  deliveries: OrderDeliveriesModule;
  discounts: OrderDiscountsModule;
  positions: OrderPositionsModule;
  payments: OrderPaymentsModule;
};
