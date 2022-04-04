import { Context } from './api';
import { FindOptions, LogFields, TimestampFields, _ID } from './common';
import { Order } from './orders';
import { OrderDiscount } from './orders.discounts';
import { IOrderPricingSheet, OrderPrice, OrderPricingDiscount } from './orders.pricing';

export enum OrderPaymentStatus {
  OPEN = 'OPEN', // Null value is mapped to OPEN status
  PAID = 'PAID',
  REFUNDED = 'REFUNDED',
}

export type OrderPayment = {
  _id?: _ID;
  orderId: string;
  context?: any;
  paid?: Date;
  transactionId?: string;
  paymentProviderId?: string;
  status?: OrderPaymentStatus | null;
  calculation?: Array<any>;
} & LogFields &
  TimestampFields;

export type OrderPaymentsModule = {
  // Queries
  findOrderPayment: (
    params: {
      orderPaymentId: string;
    },
    options?: FindOptions,
  ) => Promise<OrderPayment>;

  findOrderPaymentByContextData: (
    params: {
      context: any;
    },
    options?: FindOptions,
  ) => Promise<OrderPayment>;

  countOrderPaymentsByContextData: (
    params: {
      context: any;
    },
    options?: FindOptions,
  ) => Promise<number>;

  // Transformations
  discounts: (
    orderPayment: OrderPayment,
    params: { order: Order; orderDiscount: OrderDiscount },
    requestContext: Context,
  ) => Array<OrderPricingDiscount>;
  isBlockingOrderConfirmation: (orderPayment: OrderPayment, requestContext: Context) => Promise<boolean>;
  isBlockingOrderFullfillment: (orderPayment: OrderPayment) => boolean;
  normalizedStatus: (orderPayment: OrderPayment) => string;
  pricingSheet: (orderPayment: OrderPayment, currency: string) => IOrderPricingSheet;

  // Mutations
  create: (doc: OrderPayment, userId?: string) => Promise<OrderPayment>;

  cancel: (
    orderPayment: OrderPayment,
    paymentContext: any,
    requestContext: Context,
  ) => Promise<OrderPayment>;

  confirm: (
    orderPayment: OrderPayment,
    paymentContext: any,
    requestContext: Context,
  ) => Promise<OrderPayment>;

  charge: (
    orderPayment: OrderPayment,
    paymentContext: any,
    requestContext: Context,
  ) => Promise<OrderPayment>;

  logEvent: (orderPaymentId: string, event: any, userId?: string) => Promise<boolean>;

  markAsPaid: (payment: OrderPayment, meta: any, userId?: string) => Promise<void>;

  updateContext: (
    orderPaymentId: string,
    params: { orderId: string; context: any },
    requestContext: Context,
  ) => Promise<OrderPayment>;

  updateStatus: (
    orderPaymentId: string,
    params: { transactionId?: string; status: OrderPaymentStatus; info?: string },
    userId?: string,
  ) => Promise<OrderPayment>;

  updateCalculation: (orderPayment: OrderPayment, requestContext: Context) => Promise<OrderPayment>;
};

export type OrderPaymentDiscount = Omit<OrderPrice, '_id'> & {
  _id?: string;
  discountId: string;
  item: OrderPayment;
};
