import { Context } from './api';
import { FindOptions, LogFields, TimestampFields, _ID } from './common';
import { IDeliveryPricingSheet } from './delivery.pricing';
import { Order } from './orders';
import { OrderDiscount } from './orders.discounts';
import { OrderPrice, OrderPricingDiscount } from './orders.pricing';

export enum OrderDeliveryStatus {
  OPEN = 'OPEN', // Null value is mapped to OPEN status
  DELIVERED = 'DELIVERED',
  RETURNED = 'RETURNED',
}

export type OrderDelivery = {
  _id?: _ID;
  orderId: string;
  deliveryProviderId: string;
  delivered?: Date;
  status: OrderDeliveryStatus | null;
  context?: any;
  calculation: Array<any>;
} & LogFields &
  TimestampFields;

export type OrderDeliveriesModule = {
  // Queries
  findDelivery: (params: { orderDeliveryId: string }, options?: FindOptions) => Promise<OrderDelivery>;

  // Transformations
  discounts: (
    orderDelivery: OrderDelivery,
    params: { order: Order; orderDiscount: OrderDiscount },
    requestContext: Context,
  ) => Array<OrderPricingDiscount>;
  isBlockingOrderConfirmation: (
    orderDelivery: OrderDelivery,
    requestContext: Context,
  ) => Promise<boolean>;
  isBlockingOrderFullfillment: (orderDelivery: OrderDelivery) => boolean;
  normalizedStatus: (orderDelivery: OrderDelivery) => string;
  pricingSheet: (
    orderDelivery: OrderDelivery,
    currency: string,
    requestContext: Context,
  ) => IDeliveryPricingSheet;

  // Mutations
  create: (doc: OrderDelivery, userId?: string) => Promise<OrderDelivery>;
  delete: (orderDeliveryId: string, userId?: string) => Promise<number>;

  markAsDelivered: (orderDelivery: OrderDelivery, userId?: string) => Promise<void>;

  send: (
    orderDelivery: OrderDelivery,
    params: { order: Order; deliveryContext?: any },
    requestContext: Context,
  ) => Promise<OrderDelivery>;

  updateContext: (
    orderDeliveryId: string,
    params: { context: any },
    requestContext: Context,
  ) => Promise<OrderDelivery>;

  updateStatus: (
    orderDeliveryId: string,
    params: { status: OrderDeliveryStatus; info?: string },
    userId?: string,
  ) => Promise<OrderDelivery>;

  updateCalculation: (orderDelivery: OrderDelivery, requestContext: Context) => Promise<OrderDelivery>;
};

export type OrderDeliveryDiscount = Omit<OrderPrice, '_id'> & {
  _id?: string;
  discountId: string;
  item: OrderDelivery;
};
