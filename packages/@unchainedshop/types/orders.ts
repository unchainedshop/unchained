import { Context } from './api';
import {
  Address,
  Contact,
  FindOptions,
  LogFields,
  TimestampFields,
  _ID,
} from './common';
import { OrderDeliveriesModule, OrderDelivery } from './orders.deliveries';
import { OrderDiscount, OrderDiscountsModule } from './orders.discounts';
import { OrderPayment, OrderPaymentsModule } from './orders.payments';
import { OrderPosition, OrderPositionsModule } from './orders.positions';
import { IOrderPricingSheet, OrderPrice, OrderPricingDiscount } from './orders.pricing';
import { PricingDiscount } from './pricing';
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

type OrderTransactionContext = {
  paymentContext?: any;
  deliveryContext?: any;
  orderContext?: any;
};
type OrderContextParams<P> = (
  order: Order,
  params: P,
  requestContext: Context
) => Promise<Order>;

export interface OrderQueries {
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
}
export interface OrderTransformations {
  discounted: (
    order: Order,
    orderDiscount: OrderDiscount,
    requestContext: Context
  ) => Promise<Array<OrderPricingDiscount>>
  discountTotal: (
    order: Order,
    orderDiscount: OrderDiscount,
    requestContext: Context
  ) => Promise<OrderPrice>;

  normalizedStatus: (order: Order) => string;
  isCart: (order: Order) => boolean;
  cart: (
    order: { countryContext?: string; orderNumber?: string },
    user: User
  ) => Promise<Order>;
  pricingSheet: (order: Order) => IOrderPricingSheet;
}

export interface OrderProcessing {
  checkout: OrderContextParams<OrderTransactionContext>;
  confirm: OrderContextParams<OrderTransactionContext>;
  ensureCartForUser: OrderContextParams<{ user: User; countryContext: string }>;
  nextStatus: (order: Order) => Promise<OrderStatus | null>;
  processOrder: OrderContextParams<OrderTransactionContext>;
  sendOrderConfirmationToCustomer: OrderContextParams<{ locale: string }>;
}

export interface OrderMutations {
  create: (
    doc: {
      orderNumber?: string;
      currency: string;
      countryCode: string;
      billingAddress?: Address;
      contact?: Contact;
    },
    userId?: string
  ) => Promise<Order>;

  delete: (orderId: string, userId?: string) => Promise<number>;

  setDeliveryProvider: (
    orderId: string,
    deliveryProviderId: string,
    requestContext: Context
  ) => Promise<Order>;
  setPaymentProvider: (
    orderId: string,
    paymentProviderId: string,
    requestContext: Context
  ) => Promise<Order>;

  updateBillingAddress: (
    orderId: string,
    billingAddress: Address,
    requestContext: Context
  ) => Promise<Order>;
  updateContact: (
    orderId: string,
    contact: Contact,
    requestContext: Context
  ) => Promise<Order>;
  updateContext: (
    orderId: string,
    context: any,
    requestContext: Context
  ) => Promise<Order>;
  updateStatus: (
    orderId: string,
    params: { status: OrderStatus; info?: string },
    requestContext: Context
  ) => Promise<Order>;

  updateCalculation: (
    orderId: string,
    requestContext: Context
  ) => Promise<Order>;
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
