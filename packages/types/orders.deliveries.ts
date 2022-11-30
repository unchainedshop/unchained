import { FindOptions, LogFields, TimestampFields, _ID } from './common';
import { UnchainedCore } from './core';
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
    unchainedAPI: UnchainedCore,
  ) => Array<OrderPricingDiscount>;
  isBlockingOrderConfirmation: (
    orderDelivery: OrderDelivery,
    unchainedAPI: UnchainedCore,
  ) => Promise<boolean>;
  isBlockingOrderFullfillment: (orderDelivery: OrderDelivery) => boolean;
  normalizedStatus: (orderDelivery: OrderDelivery) => string;
  pricingSheet: (
    orderDelivery: OrderDelivery,
    currency: string,
    unchainedAPI: UnchainedCore,
  ) => IDeliveryPricingSheet;

  // Mutations
  create: (doc: OrderDelivery) => Promise<OrderDelivery>;
  delete: (orderDeliveryId: string) => Promise<number>;

  markAsDelivered: (orderDelivery: OrderDelivery) => Promise<void>;

  send: (
    orderDelivery: OrderDelivery,
    params: { order: Order; deliveryContext?: any },
    unchainedAPI: UnchainedCore,
  ) => Promise<OrderDelivery>;

  updateContext: (
    orderDeliveryId: string,
    context: any,
    unchainedAPI: UnchainedCore,
  ) => Promise<boolean>;

  updateStatus: (
    orderDeliveryId: string,
    params: { status: OrderDeliveryStatus; info?: string },
  ) => Promise<OrderDelivery>;

  updateCalculation: (
    orderDelivery: OrderDelivery,
    unchainedAPI: UnchainedCore,
  ) => Promise<OrderDelivery>;
};

export type OrderDeliveryDiscount = Omit<OrderPrice, '_id'> & {
  _id?: string;
  discountId: string;
  item: OrderDelivery;
};
