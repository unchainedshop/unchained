import { FindOptions, LogFields, TimestampFields, _ID } from './common';
import { UnchainedCore } from './core';
import { Order } from './orders';
import { OrderDiscount } from './orders.discounts';
import { OrderPrice, OrderPricingDiscount } from './orders.pricing';
import { IPaymentPricingSheet } from './payments.pricing';

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
    unchainedAPI: UnchainedCore,
  ) => Array<OrderPricingDiscount>;
  isBlockingOrderConfirmation: (
    orderPayment: OrderPayment,
    unchainedAPI: UnchainedCore,
  ) => Promise<boolean>;
  isBlockingOrderFullfillment: (orderPayment: OrderPayment) => boolean;
  normalizedStatus: (orderPayment: OrderPayment) => string;
  pricingSheet: (
    orderPayment: OrderPayment,
    currency: string,
    unchainedAPI: UnchainedCore,
  ) => IPaymentPricingSheet;

  // Mutations
  create: (doc: OrderPayment) => Promise<OrderPayment>;

  cancel: (
    orderPayment: OrderPayment,
    paymentContext: any,
    unchainedAPI: UnchainedCore,
  ) => Promise<OrderPayment>;

  confirm: (
    orderPayment: OrderPayment,
    paymentContext: any,
    unchainedAPI: UnchainedCore,
  ) => Promise<OrderPayment>;

  charge: (
    orderPayment: OrderPayment,
    paymentContext: any,
    unchainedAPI: UnchainedCore,
  ) => Promise<OrderPayment>;

  logEvent: (orderPaymentId: string, event: any) => Promise<boolean>;

  markAsPaid: (payment: OrderPayment, meta: any) => Promise<void>;

  updateContext: (orderPaymentId: string, context: any, unchainedAPI: UnchainedCore) => Promise<boolean>;

  updateStatus: (
    orderPaymentId: string,
    params: { transactionId?: string; status: OrderPaymentStatus; info?: string },
  ) => Promise<OrderPayment>;

  updateCalculation: (orderPayment: OrderPayment, unchainedAPI: UnchainedCore) => Promise<OrderPayment>;
};

export type OrderPaymentDiscount = Omit<OrderPrice, '_id'> & {
  _id?: string;
  discountId: string;
  item: OrderPayment;
};
